export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentYearCycle = () => {
  const year = new Date().getFullYear();
  return {
    cycleStart: `${year}-01-01`,
    cycleEnd: `${year}-12-31`
  };
};

export const monthKey = (date: string) => date.slice(0, 7);

export const daysInMonth = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};
