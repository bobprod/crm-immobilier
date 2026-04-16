const orderBy = { _count: { eventName: 'desc' } };

function buildOrderByClause(orderBy) {
  if (Array.isArray(orderBy)) {
    return orderBy
      .map((o) => {
        const [key, dir] = Object.entries(o)[0];
        if (typeof dir === 'object' && dir !== null) {
          const val = Object.values(dir)[0];
          return `"${key}" ${val.toUpperCase()}`;
        }
        return `"${key}" ${dir.toUpperCase()}`;
      })
      .join(', ');
  }

  const [key, dir] = Object.entries(orderBy)[0];
  if (typeof dir === 'object' && dir !== null) {
    const val = Object.values(dir)[0];
    return `"${key}" ${val.toUpperCase()}`;
  }
  return `"${key}" ${dir.toUpperCase()}`;
}

console.log(buildOrderByClause(orderBy));
