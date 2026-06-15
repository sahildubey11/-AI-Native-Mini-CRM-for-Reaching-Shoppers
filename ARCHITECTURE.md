**Architecture Diagram**

```mermaid
flowchart TD
  subgraph Frontend
    A[Next.js / UI shell (client/)]
  end

  subgraph Backend
    B[CRM Backend (server/)]
  end

  subgraph Simulator
    C[Channel Simulator (simulator/)]
  end

  A --> B
  B --> C
  C --> B[Receipt callback / POST /receipt]
  B --> DB[(MongoDB / Persisted Store)]
  B --> Analytics[(Analytics Dashboard)]
```

Video script (30-60s)

- 0-10s: Show the homepage and describe the AI-first approach: "Tell the product who you want to reach." (Show segment prompt and generate)
- 10-25s: Show generated audience, recommended channel, and message generation.
- 25-40s: Save and launch the campaign; switch to Render logs or the event feed to show simulator callbacks arriving.
- 40-55s: Open analytics and show funnel and AI insights.
- Close: Summarize scoping decisions and mention the separate simulator service.

Suggested screenshots to include in submission

- UI: AI segment prompt and preview
- UI: Generated message + channel recommendation
- UI: Campaign launch confirmation and event feed
- Render logs showing POST /receipt entries
- Architecture mermaid diagram

Notes

Keep the video short and focused — demo the STAR feature (AI segment builder), message generation, and the simulator callbacks. Explain that persistence and real providers were intentionally scoped out to focus on the AI flow and backend-simulator interaction.
