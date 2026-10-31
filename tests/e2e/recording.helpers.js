import { expect } from '@playwright/test';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { dirname } from 'node:path';

// Encode the automated viewport in Chrome instead of relying on a native FFmpeg executable.
export async function startRecording(page) {
  if (process.env.CI) {
    const video = page.video();
    if (!video) throw new Error('CI film tests require native browser video capture');
    return async (path, testInfo, name) => {
      await page.close();
      await mkdir(dirname(path), { recursive: true });
      await video.saveAs(path);
      const { size } = await stat(path);
      expect(size).toBeGreaterThan(1000);
      // Browser media loading seeks through the file with Range requests.
      // Stream long movies instead of copying them into a huge data URL.
      const server = createServer((request, response) => {
        const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
        const start = range ? Number(range[1]) : 0;
        const end = range && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start > end || start >= size) {
          response.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
          return;
        }
        response.writeHead(range ? 206 : 200, {
          'Content-Type': 'video/webm', 'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
        });
        const stream = createReadStream(path, { start, end });
        response.on('close', () => stream.destroy());
        stream.pipe(response);
      });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const probe = await page.context().newPage();
      try {
        const metadata = await probe.evaluate(async (source) => {
          const element = document.createElement('video');
          element.preload = 'auto';
          const ready = new Promise((resolve, reject) => {
            element.onloadeddata = resolve;
            element.onerror = () => reject(new Error('Recorded WebM cannot be decoded'));
          });
          element.src = source;
          await ready;
          return { width: element.videoWidth, height: element.videoHeight, duration: element.duration };
        }, `http://127.0.0.1:${server.address().port}/recording.webm`);
        expect([metadata.width, metadata.height]).toEqual([1440, 900]);
        expect(metadata.duration).toBeGreaterThan(5);
        await testInfo.attach(`${name}-metadata`, { body: JSON.stringify(metadata), contentType: 'application/json' });
      } finally {
        await probe.close();
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      }
      await testInfo.attach(name, { path, contentType: 'video/webm' });
    };
  }
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440; canvas.height = 900;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    const stream = canvas.captureStream(0);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.start(1000);
    window.__viewportRecording = { canvas, stream, recorder, chunks, mimeType };
  });
  const session = await page.context().newCDPSession(page);
  let frames = 0;
  let pending = Promise.resolve();
  let failure;
  const receiveFrame = (frame) => {
    pending = pending.then(async () => {
      await page.evaluate(async (image) => {
        const recording = window.__viewportRecording;
        const bitmap = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${image}`)).blob());
        recording.canvas.getContext('2d').drawImage(bitmap, 0, 0, 1440, 900);
        bitmap.close();
        recording.stream.getVideoTracks()[0].requestFrame();
      }, frame.data);
      await session.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
      frames++;
    }).catch((error) => { failure = error; });
  };
  session.on('Page.screencastFrame', receiveFrame);
  await session.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  await expect.poll(() => frames).toBeGreaterThan(0);
  return async (path, testInfo, name) => {
    await session.send('Page.stopScreencast');
    session.off('Page.screencastFrame', receiveFrame);
    await pending;
    if (failure) throw failure;
    const encoded = await page.evaluate(async () => {
      const state = window.__viewportRecording;
      await new Promise((resolve) => { state.recorder.onstop = resolve; state.recorder.stop(); });
      state.stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(state.chunks, { type: state.mimeType });
      const data = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
      state.canvas.remove();
      delete window.__viewportRecording;
      return String(data).slice(String(data).indexOf(',') + 1);
    });
    await session.detach();
    const bytes = Buffer.from(encoded, 'base64');
    expect(frames).toBeGreaterThan(5);
    expect(bytes.length).toBeGreaterThan(1000);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
    await testInfo.attach(name, { path, contentType: 'video/webm' });
  };
}
