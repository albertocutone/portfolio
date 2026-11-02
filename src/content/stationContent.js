// Resolve each CV topic against the authored CV and project records.
export function getStationContent(station, content) {
  const education = station.kind === 'education' ? content.education : [];
  const experiences = station.kind === 'recap' ? content.experiences : (station.experienceIds ?? []).map(id => {
    const experience = content.experiences.find(item => item.id === id);
    if (!experience) throw new Error(`Unknown station experience: ${station.id} / ${id}`);
    return experience;
  });
  const linkedIds = new Set([...education.map(item => item.projectId), ...experiences.flatMap(item => item.projectIds)]);
  const projects = station.kind === 'recap' ? content.projects : content.projects.filter(project => project.station === station.id || linkedIds.has(project.id));
  return { education, experiences, projects };
}
