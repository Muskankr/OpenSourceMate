import {
  LocalJsonJobDataSource,
  InMemoryJobDataSource,
  getDefaultJobDataSource,
  setDefaultJobDataSource,
} from "../services/jobDataSource";
import { rankJobListings } from "../utils/jobRanking";
import type { JobListing } from "../types/jobs";

describe("JobDataSource pluggability", () => {
  const originalDefaultSource = getDefaultJobDataSource();

  afterEach(() => {
    setDefaultJobDataSource(originalDefaultSource);
  });

  it("loads listings from local JSON file via LocalJsonJobDataSource", () => {
    const source = new LocalJsonJobDataSource();
    const listings = source.getJobListings();

    expect(Array.isArray(listings)).toBe(true);
    expect(listings.length).toBeGreaterThan(0);
    expect(listings[0]).toHaveProperty("id");
    expect(listings[0]).toHaveProperty("title");
    expect(listings[0]).toHaveProperty("requiredSkills");
  });

  it("supports in-memory data source for dynamic listing management", () => {
    const customListings: JobListing[] = [
      {
        id: "custom-1",
        title: "Go Developer",
        company: "Golang Org",
        location: "Remote",
        roleType: "full-time",
        experienceLevel: "entry",
        requiredSkills: ["Go"],
        description: "Write Go code",
      },
    ];

    const inMemorySource = new InMemoryJobDataSource(customListings);
    expect(inMemorySource.getJobListings()).toHaveLength(1);
    expect(inMemorySource.getJobListings()[0].title).toBe("Go Developer");

    inMemorySource.setListings([]);
    expect(inMemorySource.getJobListings()).toHaveLength(0);
  });

  it("swaps the data source without changing the ranking code", () => {
    // 1. Run ranking using Local JSON Data Source
    const localSource = new LocalJsonJobDataSource();
    const localListings = localSource.getJobListings();
    const localRanked = rankJobListings(localListings, ["TypeScript"]);
    expect(localRanked.length).toBe(localListings.length);

    // 2. Swap to a completely different In-Memory Data Source
    const swappedSource = new InMemoryJobDataSource([
      {
        id: "swapped-ai-1",
        title: "AI Specialist",
        company: "OpenAI Partner",
        location: "Remote",
        roleType: "internship",
        experienceLevel: "entry",
        requiredSkills: ["Python", "PyTorch"],
        description: "Fine-tune models",
      },
    ]);

    // 3. Same ranking code invoked without modification
    const swappedListings = swappedSource.getJobListings();
    const swappedRanked = rankJobListings(swappedListings, ["Python"]);

    expect(swappedRanked).toHaveLength(1);
    expect(swappedRanked[0].id).toBe("swapped-ai-1");
    expect(swappedRanked[0].matchedSkills).toContain("Python");
    expect(swappedRanked[0].score).toBeGreaterThan(0);
  });

  it("swaps the global default data source seamlessly", () => {
    const mockSource = new InMemoryJobDataSource([
      {
        id: "mock-1",
        title: "Mock Job",
        company: "Mock Co",
        location: "Remote",
        roleType: "internship",
        experienceLevel: "entry",
        requiredSkills: ["Testing"],
        description: "Test job",
      },
    ]);

    setDefaultJobDataSource(mockSource);
    expect(getDefaultJobDataSource().getJobListings()).toHaveLength(1);
    expect(getDefaultJobDataSource().getJobListings()[0].id).toBe("mock-1");
  });
});
