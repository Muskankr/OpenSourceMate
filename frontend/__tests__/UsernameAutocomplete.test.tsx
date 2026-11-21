import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsernameAutocomplete from '../components/UsernameAutocomplete';

describe('UsernameAutocomplete Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input with combobox accessibility attributes', () => {
    render(<UsernameAutocomplete value="" onChange={jest.fn()} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not trigger fetch if input is less than minChars (3)', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    render(<UsernameAutocomplete value="ab" onChange={jest.fn()} minChars={3} debounceMs={50} />);

    await new Promise((r) => setTimeout(r, 100));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and displays suggestions after debounce', async () => {
    const mockUsers = [
      { username: 'octocat', avatar_url: 'https://example.com/avatar1.png' },
      { username: 'octocat-pro', avatar_url: 'https://example.com/avatar2.png' },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsers,
    });

    const onChangeMock = jest.fn();
    const onSelectMock = jest.fn();

    render(
      <UsernameAutocomplete
        value="octo"
        onChange={onChangeMock}
        onSelectUser={onSelectMock}
        debounceMs={20}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('@octocat')).toBeInTheDocument();
      expect(screen.getByText('@octocat-pro')).toBeInTheDocument();
    });

    // Click first suggestion
    fireEvent.click(screen.getByText('@octocat'));
    expect(onChangeMock).toHaveBeenCalledWith('octocat');
    expect(onSelectMock).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('supports keyboard arrow navigation and Enter selection', async () => {
    const mockUsers = [
      { username: 'babin1' },
      { username: 'babin2' },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsers,
    });

    const onChangeMock = jest.fn();
    render(
      <UsernameAutocomplete
        value="babin"
        onChange={onChangeMock}
        debounceMs={20}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Highlight babin1
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Highlight babin2
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChangeMock).toHaveBeenCalledWith('babin2');
  });

  it('falls back to plain input on rate-limit 429 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    render(<UsernameAutocomplete value="rate_limited_user" onChange={jest.fn()} debounceMs={20} />);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
