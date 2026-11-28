import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

const sections = [
  { label: "Getting Started", to: "/docs/DEPLOYMENT", description: "Set up, deploy, and operate OpenSourceMate." },
  { label: "Architecture", to: "/docs/adr", description: "Understand the decisions behind the system." },
  { label: "Tutorials", to: "/docs/tutorials", description: "Make common frontend and backend contributions." },
  { label: "API Reference", to: "/docs/api-v1-and-openapi-docs", description: "Explore the versioned API and interactive OpenAPI docs." },
];

export default function Home() {
  return (
    <Layout title="Documentation" description="OpenSourceMate developer documentation">
      <header className="hero hero--primary heroBanner">
        <div className="container">
          <Heading as="h1">OpenSourceMate Documentation</Heading>
          <p>Guides, architecture decisions, tutorials, and API references for contributors.</p>
          <Link className="button button--secondary button--lg" to="/docs/DEPLOYMENT">
            Browse the documentation
          </Link>
        </div>
      </header>
      <main>
        <section className="container margin-vert--lg">
          <div className="row">
            {sections.map((section) => (
              <div className="col col--3 margin-bottom--lg" key={section.to}>
                <div className="card shadow--md h-100">
                  <div className="card__header">
                    <Heading as="h2" className="text--truncate">{section.label}</Heading>
                  </div>
                  <div className="card__body">
                    <p>{section.description}</p>
                  </div>
                  <div className="card__footer">
                    <Link to={section.to}>Explore section →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
