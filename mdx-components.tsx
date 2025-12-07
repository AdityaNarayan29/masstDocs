import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Mermaid } from "@/components/mdx/mermaid";
import type { MDXComponents } from 'mdx/types';

// Cache for base components to avoid creating new objects on every render
const baseComponents: MDXComponents = {
  ...defaultMdxComponents,
  Mermaid,
};

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  if (!components) {
    return baseComponents;
  }
  return {
    ...baseComponents,
    ...components,
  };
}
