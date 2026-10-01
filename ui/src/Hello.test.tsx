import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createAppStore } from './store';

function renderApp() {
  return render(
    <Provider store={createAppStore()}>
      <App />
    </Provider>,
  );
}

describe('hello shell', () => {
  const timestampUtc = '2026-10-01T12:00:00.000Z';
  const localTimestamp = new Date(timestampUtc).toLocaleString();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the API greeting followed by its timestamp in local time', async () => {
    // AC2
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Hello World', timestampUtc }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    renderApp();

    expect(
      await screen.findByRole('heading', {
        name: `Hello World ${localTimestamp}`,
      }),
    ).toBeInTheDocument();
  });

  it('renders a loading state while the API request is pending', async () => {
    // AC2
    let finishRequest!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finishRequest = resolve;
          }),
      ),
    );

    renderApp();

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    await waitFor(() =>
      expect(finishRequest).toBeTypeOf('function'),
    );
    finishRequest(
      new Response(JSON.stringify({ message: 'Hello World', timestampUtc }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: `Hello World ${localTimestamp}`,
        }),
      ).toBeInTheDocument(),
    );
  });

  it('renders an error state when the API request fails', async () => {
    // AC2
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Server Error' }),
      ),
    );

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /unable to load greeting/i,
    );
  });
});
