import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PastedTextAnalyzer from '../components/PastedTextAnalyzer';

describe('PastedTextAnalyzer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input textarea, privacy disclaimer and extract button', () => {
    render(<PastedTextAnalyzer />);

    expect(screen.getByText(/Paste Resume, Bio, or Project Description/i)).toBeInTheDocument();
    expect(screen.getByRole('note', { name: /Privacy disclaimer/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Pasted resume or bio text input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extract Skills from Text/i })).toBeInTheDocument();
  });

  it('displays character counter while typing', async () => {
    render(<PastedTextAnalyzer />);
    const textarea = screen.getByRole('textbox', { name: /Pasted resume or bio text input/i });

    await userEvent.type(textarea, 'Python, React, TypeScript');
    expect(screen.getByText(/25 \/ 10,000 characters/i)).toBeInTheDocument();
  });

  it('shows error message if submitted with fewer than 5 characters', async () => {
    render(<PastedTextAnalyzer />);
    const button = screen.getByRole('button', { name: /Extract Skills from Text/i });

    // Enable button by typing 2 characters
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'hi');
    fireEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 5 characters/i);
  });

  it('calls API and displays extracted skills on successful response', async () => {
    const mockSkills = [
      { skill: 'React', occurrences: 2, confidence: 95, category: 'framework' },
      { skill: 'Python', occurrences: 1, confidence: 80, category: 'language' },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        skills: mockSkills,
        total_extracted: 2,
        character_count: 50,
        categories: { framework: 2, language: 1 },
      }),
    });

    const onExtractedMock = jest.fn();
    render(<PastedTextAnalyzer onSkillsExtracted={onExtractedMock} />);

    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Building modern fullstack applications with React and Python.');
    fireEvent.click(screen.getByRole('button', { name: /Extract Skills from Text/i }));

    await waitFor(() => {
      expect(screen.getByText('Extracted Skills (2)')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    expect(onExtractedMock).toHaveBeenCalledWith(mockSkills);
  });

  it('clears text and results when Clear button is clicked', async () => {
    render(<PastedTextAnalyzer />);
    const textarea = screen.getByRole('textbox');

    await userEvent.type(textarea, 'Python and Rust developer');
    expect(textarea).toHaveValue('Python and Rust developer');

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    expect(textarea).toHaveValue('');
  });
});
