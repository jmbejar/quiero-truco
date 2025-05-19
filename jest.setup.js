require('@testing-library/jest-dom'); 

// Silence console.error during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Restore console.error after tests
afterAll(() => {
  console.error.mockRestore();
});