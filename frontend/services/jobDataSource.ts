import type { JobDataSource, JobListing } from "../types/jobs";
import defaultJobListings from "../data/job_listings.json";

/**
 * Local JSON file implementation of the JobDataSource interface.
 * Reads pre-curated job listings bundled with the application.
 */
export class LocalJsonJobDataSource implements JobDataSource {
  private listings: JobListing[];

  constructor(customListings?: JobListing[]) {
    this.listings = customListings || (defaultJobListings as JobListing[]);
  }

  getJobListings(): JobListing[] {
    return [...this.listings];
  }
}

/**
 * In-memory implementation of JobDataSource, convenient for mocking,
 * dynamic updates, and testing.
 */
export class InMemoryJobDataSource implements JobDataSource {
  private listings: JobListing[];

  constructor(listings: JobListing[] = []) {
    this.listings = [...listings];
  }

  setListings(listings: JobListing[]): void {
    this.listings = [...listings];
  }

  getJobListings(): JobListing[] {
    return [...this.listings];
  }
}

let activeDataSource: JobDataSource = new LocalJsonJobDataSource();

/**
 * Retrieves the currently active pluggable JobDataSource.
 */
export function getDefaultJobDataSource(): JobDataSource {
  return activeDataSource;
}

/**
 * Swaps the active JobDataSource at runtime without modifying ranking or business logic.
 */
export function setDefaultJobDataSource(dataSource: JobDataSource): void {
  activeDataSource = dataSource;
}
