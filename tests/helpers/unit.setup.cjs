jest.mock('@/lib/firebase', () => ({
  getFirestoreDatabase: () => { throw new Error('Test jednostkowy nie może łączyć się z bazą.'); },
}));
