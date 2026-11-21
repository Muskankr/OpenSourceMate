import React from 'react';
import { render, screen } from '@testing-library/react';
import InterestsDisplay from '../components/InterestsDisplay';

describe('InterestsDisplay Component', () => {
  const sampleTopics = [
    { topic: 'fastapi', count: 4 },
    { topic: 'kubernetes', count: 2 },
    { topic: 'machine-learning', count: 1 },
  ];

  const sampleLanguages = [
    { language: 'Python', count: 6 },
    { language: 'Rust', count: 3 },
  ];

  it('renders topics and languages with count badges', () => {
    render(
      <InterestsDisplay
        topics={sampleTopics}
        languages={sampleLanguages}
        starredCount={15}
      />
    );

    expect(screen.getByText(/Areas of Interest & Curiosity/i)).toBeInTheDocument();
    expect(screen.getByText('Derived from 15 starred repos')).toBeInTheDocument();

    expect(screen.getByText('#fastapi')).toBeInTheDocument();
    expect(screen.getByText('×4')).toBeInTheDocument();
    expect(screen.getByText('#kubernetes')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('returns null when both topics and languages are empty', () => {
    const { container } = render(
      <InterestsDisplay topics={[]} languages={[]} />
    );

    expect(container.firstChild).toBeNull();
  });
});
