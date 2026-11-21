import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RepositorySelector, { type RepositoryItem } from '../components/RepositorySelector';

const sampleRepositories: RepositoryItem[] = [
  {
    name: 'react-dashboard',
    full_name: 'testuser/react-dashboard',
    description: 'Modern dashboard in React',
    language: 'TypeScript',
    stargazers_count: 24,
    fork: false,
    archived: false,
  },
  {
    name: 'python-api',
    full_name: 'testuser/python-api',
    description: 'FastAPI microservice backend',
    language: 'Python',
    stargazers_count: 10,
    fork: false,
    archived: false,
  },
  {
    name: 'upstream-fork',
    full_name: 'testuser/upstream-fork',
    description: 'Forked library for course',
    language: 'JavaScript',
    fork: true,
    archived: false,
  },
  {
    name: 'old-archive',
    full_name: 'testuser/old-archive',
    description: 'Archived experiment',
    language: 'C++',
    fork: false,
    archived: true,
  },
];

describe('RepositorySelector Component', () => {
  it('renders repository checklist with defaults excluding forks and archives', () => {
    render(<RepositorySelector repositories={sampleRepositories} />);

    expect(screen.getByText(/Included Repositories/i)).toBeInTheDocument();
    // 2 sources selected by default out of 4 total
    expect(screen.getByText('2 of 4 selected')).toBeInTheDocument();

    const reactCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/react-dashboard/i });
    const pythonCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/python-api/i });
    const forkCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/upstream-fork/i });
    const archiveCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/old-archive/i });

    expect(reactCheckbox).toBeChecked();
    expect(pythonCheckbox).toBeChecked();
    expect(forkCheckbox).not.toBeChecked();
    expect(archiveCheckbox).not.toBeChecked();
  });

  it('toggles selection when checkbox is clicked and calls onChange', () => {
    const onChangeMock = jest.fn();
    render(<RepositorySelector repositories={sampleRepositories} onChange={onChangeMock} />);

    const forkCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/upstream-fork/i });
    fireEvent.click(forkCheckbox);

    expect(forkCheckbox).toBeChecked();
    expect(screen.getByText('3 of 4 selected')).toBeInTheDocument();
    expect(onChangeMock).toHaveBeenCalled();
  });

  it('selects all repositories when Select All is clicked', () => {
    const onChangeMock = jest.fn();
    render(<RepositorySelector repositories={sampleRepositories} onChange={onChangeMock} />);

    const selectAllBtn = screen.getByRole('button', { name: /Select All/i });
    fireEvent.click(selectAllBtn);

    expect(screen.getByText('4 of 4 selected')).toBeInTheDocument();
    expect(onChangeMock).toHaveBeenCalledWith(sampleRepositories);
  });

  it('clears all repositories when Clear All is clicked', () => {
    const onChangeMock = jest.fn();
    render(<RepositorySelector repositories={sampleRepositories} onChange={onChangeMock} />);

    const clearAllBtn = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearAllBtn);

    expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
    expect(onChangeMock).toHaveBeenCalledWith([]);
  });

  it('restores defaults when Defaults button is clicked', () => {
    render(<RepositorySelector repositories={sampleRepositories} />);

    // First clear all
    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();

    // Now restore defaults
    fireEvent.click(screen.getByRole('button', { name: /Defaults/i }));
    expect(screen.getByText('2 of 4 selected')).toBeInTheDocument();
  });

  it('filters repositories via search input', async () => {
    render(<RepositorySelector repositories={sampleRepositories} />);

    const searchInput = screen.getByRole('searchbox', { name: /Filter repositories/i });
    await userEvent.type(searchInput, 'Python');

    expect(screen.getByText('python-api')).toBeInTheDocument();
    expect(screen.queryByText('react-dashboard')).not.toBeInTheDocument();
  });

  it('filters repositories by sources and forks tabs', () => {
    render(<RepositorySelector repositories={sampleRepositories} />);

    const forksTab = screen.getByRole('button', { name: /Forks \(1\)/i });
    fireEvent.click(forksTab);

    expect(screen.getByText('upstream-fork')).toBeInTheDocument();
    expect(screen.queryByText('react-dashboard')).not.toBeInTheDocument();
  });

  it('announces live selection changes for screen readers', () => {
    render(<RepositorySelector repositories={sampleRepositories} />);

    const forkCheckbox = screen.getByRole('checkbox', { name: /Include repository testuser\/upstream-fork/i });
    fireEvent.click(forkCheckbox);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/testuser\/upstream-fork included in analysis/i);
  });
});
