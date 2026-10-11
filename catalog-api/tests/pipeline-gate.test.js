// Temporary demonstration: Jenkins must stop before deploying this commit.
test('intentional failure demonstrates the deployment test gate', () => {
  expect('deployment blocked').toBe('deployment allowed');
});
