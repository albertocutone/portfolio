import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';

export class RetryingVRMLLoader extends VRMLLoader {
  load(url, onLoad, onProgress, onError) {
    let retries = 0;
    const attempt = () => super.load(url, onLoad, onProgress, (error) => {
      if ([502, 503, 504].includes(error?.response?.status) && retries < 2) {
        setTimeout(attempt, 400 * 2 ** retries++);
        return;
      }
      onError?.(error);
    });
    return attempt();
  }
}
