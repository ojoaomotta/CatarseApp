# Graph Report - Catarse App  (2026-07-17)

## Corpus Check
- 38 files · ~86,661 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 309 nodes · 310 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c473d0dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- properties
- properties
- definitions
- definitions
- compilerOptions
- CapabilityRemote
- CapabilityRemote
- tauri.conf.json
- package.json
- 1. Informações Básicas da Ficha Técnica (Store Listing)
- lib.rs
- manifest.json
- compilerOptions
- default.json
- content.js
- popup.js
- Tauri + React + Typescript
- FinanceModule.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `definitions` - 9 edges
3. `definitions` - 9 edges
4. `supabase` - 6 edges
5. `compilerOptions` - 6 edges
6. `scripts` - 5 edges
7. `Capability` - 5 edges
8. `permissions` - 5 edges
9. `CapabilityRemote` - 5 edges
10. `Capability` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (24 total, 5 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (20): UserProfile, TeamMember, ClientProject, FragmentItem, styles, Dashboard(), DashboardProps, styles (+12 more)

### Community 1 - "properties"
Cohesion: 0.07
Nodes (31): description, properties, required, type, Capability, Identifier, default, description (+23 more)

### Community 2 - "properties"
Cohesion: 0.07
Nodes (31): description, properties, required, type, Capability, Identifier, default, description (+23 more)

### Community 3 - "definitions"
Cohesion: 0.10
Nodes (20): anyOf, anyOf, description, definitions, Application, Number, PermissionEntry, Target (+12 more)

### Community 4 - "definitions"
Cohesion: 0.10
Nodes (20): anyOf, anyOf, description, definitions, Application, Number, PermissionEntry, Target (+12 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 6 - "CapabilityRemote"
Cohesion: 0.11
Nodes (18): description, properties, required, type, CapabilityRemote, type, urls, webviews (+10 more)

### Community 7 - "CapabilityRemote"
Cohesion: 0.11
Nodes (18): description, properties, required, type, CapabilityRemote, type, urls, webviews (+10 more)

### Community 8 - "tauri.conf.json"
Cohesion: 0.09
Nodes (22): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+14 more)

### Community 9 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, qrcode, react, react-dom, @supabase/supabase-js, @tauri-apps/api, @tauri-apps/plugin-opener, @tauri-apps/plugin-process (+18 more)

### Community 11 - "1. Informações Básicas da Ficha Técnica (Store Listing)"
Cohesion: 0.17
Nodes (11): 1. Informações Básicas da Ficha Técnica (Store Listing), 2. Permissões e Justificativas (Permissions Justification), 3. Privacidade e Uso de Dados (Privacy & Data Use), 4. Histórico de Versões (Version History), **Categoria (Category)**, Chrome Web Store Metadata & Publishing Reference, **Declaração de Coleta de Dados (Data Collection)**, **Descrição Detalhada (Detailed Description)** (+3 more)

### Community 13 - "manifest.json"
Cohesion: 0.22
Nodes (8): action, default_popup, content_scripts, description, manifest_version, name, permissions, version

### Community 14 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 15 - "default.json"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

## Knowledge Gaps
- **184 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `properties` connect `properties` to `CapabilityRemote`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `properties` connect `properties` to `CapabilityRemote`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `definitions` connect `definitions` to `properties`, `CapabilityRemote`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._
- **Should `properties` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `properties` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._