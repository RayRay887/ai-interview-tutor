export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function fnName(slug) {
  return slug.replace(/-/g, '_')
}

export function durationFor(difficulty) {
  if (difficulty === 'Easy') return '20 min'
  if (difficulty === 'Medium') return '35 min'
  return '50 min'
}

/** @param {object} p */
export function problem(p) {
  const slug = slugify(p.title)
  return {
    slug,
    title: p.title,
    description: p.description,
    category: p.category,
    difficulty: p.difficulty,
    duration: durationFor(p.difficulty),
    featured: p.featured ?? false,
    starterCode:
      p.starterCode ??
      `def ${fnName(slug)}():\n    # Your code here\n    pass`,
    examples: p.examples ?? [
      { input: 'input = ...', output: 'result = ...' },
    ],
  }
}
