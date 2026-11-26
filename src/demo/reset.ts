// "Reset demo data": drop everything the demo saved in the browser (filters, search text,
// dismissed popups, selected rows...) and reload so the original sample data is restored.
// The signed-in user is kept.
const KEEP = ['accessToken', 'user'];

export const resetDemoData = () => {
  const original = localStorage.getItem('originalUser');
  Object.keys(localStorage).forEach((k) => {
    if (!KEEP.includes(k)) localStorage.removeItem(k);
  });
  sessionStorage.clear();
  if (original) {
    try {
      localStorage.setItem('user', JSON.stringify(JSON.parse(original).user));
    } catch {
      /* keep the current user */
    }
  }
  window.location.assign('/');
};
