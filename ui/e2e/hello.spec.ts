import { expect, test } from '@playwright/test';

test('renders the greeting and local timestamp returned by the running API', async ({ page }) => {
  // AC3
  const apiResponse = page.waitForResponse((response) =>
    response.url().includes('/api/gh-api/hello'),
  );

  await page.goto('/');

  const response = await apiResponse;
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    message: string;
    timestampUtc: string;
  };
  const localTimestamp = await page.evaluate(
    (timestampUtc) => new Date(timestampUtc).toLocaleString(),
    body.timestampUtc,
  );
  await expect(
    page.getByRole('heading', {
      name: `${body.message} ${localTimestamp}`,
    }),
  ).toBeVisible();
});
