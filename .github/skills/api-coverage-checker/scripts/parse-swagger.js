#!/usr/bin/env node

/**
 * Swagger/OpenAPI Parser Helper
 *
 * Utility script to parse and extract information from swagger/openapi JSON files.
 * This script can be used as a reference or executed directly for quick analysis.
 *
 * Usage:
 *   node parse-swagger.js <path-to-swagger-file> [options]
 *
 * Options:
 *   --version <version>   Filter by API version (e.g., 2.0)
 *   --path <pattern>      Filter by path pattern (e.g., /offers/management)
 *   --method <method>     Filter by HTTP method (e.g., POST, GET)
 *   --summary            Show only endpoint summaries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../../');
const SWAGGER_DOCS_DIR = path.resolve(REPO_ROOT, 'docs/API');
const MAX_CLI_ARGS = 20;

const resolveSwaggerPathFromArg = (swaggerArg) => {
  if (typeof swaggerArg !== 'string' || swaggerArg.trim().length === 0) {
    throw new Error('Swagger file argument is required.');
  }

  const requested = path.basename(swaggerArg.trim()).toLowerCase();
  const availableSwaggerFiles = fs
    .readdirSync(SWAGGER_DOCS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name);

  const matchedFile = availableSwaggerFiles.find(
    (fileName) => fileName.toLowerCase() === requested,
  );

  if (!matchedFile) {
    throw new Error(
      `Invalid swagger file '${swaggerArg}'. Use a JSON file name from docs/API (e.g., offers-swagger.json).`,
    );
  }

  return path.resolve(SWAGGER_DOCS_DIR, matchedFile);
};

class SwaggerParser {
  constructor(swaggerPath) {
    this.swaggerPath = swaggerPath;
    this.swagger = null;
    this.isOpenAPI3 = false;
  }

  /**
   * Load and parse the swagger file
   */
  load() {
    try {
      const content = fs.readFileSync(this.swaggerPath, 'utf8');
      this.swagger = JSON.parse(content);
      this.isOpenAPI3 = this.swagger.openapi && this.swagger.openapi.startsWith('3');
      return true;
    } catch (error) {
      console.error(`Error loading swagger file: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all API paths with optional filters
   */
  getPaths(filters = {}) {
    if (!this.swagger || !this.swagger.paths) {
      return [];
    }

    const results = [];
    const paths = this.swagger.paths;

    for (const [pathUrl, pathItem] of Object.entries(paths)) {
      // Apply path filter
      if (filters.path && !pathUrl.includes(filters.path)) {
        continue;
      }

      // Apply version filter
      if (filters.version) {
        const versionPattern = `/api/${filters.version}/`;
        if (!pathUrl.includes(versionPattern)) {
          continue;
        }
      }

      // Process each HTTP method
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          continue;
        }

        // Apply method filter
        if (filters.method && method.toLowerCase() !== filters.method.toLowerCase()) {
          continue;
        }

        results.push({
          path: pathUrl,
          method: method.toUpperCase(),
          operation: operation,
          version: this.extractVersion(pathUrl),
          tags: operation.tags || [],
          summary: operation.summary || '',
          description: operation.description || '',
        });
      }
    }

    return results;
  }

  /**
   * Extract version from API path
   */
  extractVersion(pathUrl) {
    const versionMatch = pathUrl.match(/\/api\/(\d+\.\d+)\//);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  /**
   * Get request schema for an endpoint
   */
  getRequestSchema(operation) {
    if (this.isOpenAPI3) {
      // OpenAPI 3.x format
      if (operation.requestBody && operation.requestBody.content) {
        const content = operation.requestBody.content;
        const jsonContent = content['application/json'];
        if (jsonContent && jsonContent.schema) {
          return this.resolveSchema(jsonContent.schema);
        }
      }
    } else {
      // Swagger 2.0 format
      if (operation.parameters) {
        const bodyParam = operation.parameters.find((p) => p.in === 'body');
        if (bodyParam && bodyParam.schema) {
          return this.resolveSchema(bodyParam.schema);
        }
      }
    }
    return null;
  }

  /**
   * Get response schemas for an endpoint
   */
  getResponseSchemas(operation) {
    const responses = {};

    if (!operation.responses) {
      return responses;
    }

    for (const [statusCode, response] of Object.entries(operation.responses)) {
      if (this.isOpenAPI3) {
        // OpenAPI 3.x format
        if (response.content && response.content['application/json']) {
          const schema = response.content['application/json'].schema;
          if (schema) {
            responses[statusCode] = this.resolveSchema(schema);
          }
        }
      } else {
        // Swagger 2.0 format
        if (response.schema) {
          responses[statusCode] = this.resolveSchema(response.schema);
        }
      }
    }

    return responses;
  }

  /**
   * Resolve schema references ($ref)
   */
  resolveSchema(schema, visited = new Set()) {
    if (!schema) return null;

    // Handle $ref
    if (schema.$ref) {
      const refPath = schema.$ref;

      // Prevent circular references
      if (visited.has(refPath)) {
        return { type: 'circular_reference', ref: refPath };
      }
      visited.add(refPath);

      // Extract reference path
      const parts = refPath.split('/');
      let current = this.swagger;

      for (let i = 1; i < parts.length; i++) {
        current = current[parts[i]];
        if (!current) return { type: 'unresolved_reference', ref: refPath };
      }

      return this.resolveSchema(current, visited);
    }

    // Handle object with properties
    if (schema.properties) {
      const resolved = {
        type: schema.type || 'object',
        required: schema.required || [],
        properties: {},
      };

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        resolved.properties[propName] = this.resolveSchema(propSchema, new Set(visited));
      }

      return resolved;
    }

    // Handle arrays
    if (schema.type === 'array' && schema.items) {
      return {
        type: 'array',
        items: this.resolveSchema(schema.items, new Set(visited)),
      };
    }

    // Return basic schema
    return {
      type: schema.type,
      format: schema.format,
      enum: schema.enum,
      minimum: schema.minimum,
      maximum: schema.maximum,
      pattern: schema.pattern,
    };
  }

  /**
   * Extract all fields from a schema recursively
   */
  extractFields(schema, prefix = '') {
    const fields = [];

    if (!schema || !schema.properties) {
      return fields;
    }

    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const fullPath = prefix ? `${prefix}.${fieldName}` : fieldName;
      const isRequired = schema.required && schema.required.includes(fieldName);

      fields.push({
        name: fullPath,
        type: fieldSchema.type || 'unknown',
        required: isRequired,
        format: fieldSchema.format,
        enum: fieldSchema.enum,
      });

      // Recursively process nested objects
      if (fieldSchema.properties) {
        fields.push(...this.extractFields(fieldSchema, fullPath));
      }

      // Process array items
      if (fieldSchema.type === 'array' && fieldSchema.items) {
        if (fieldSchema.items.properties) {
          fields.push(...this.extractFields(fieldSchema.items, `${fullPath}[]`));
        }
      }
    }

    return fields;
  }

  /**
   * Generate a summary report
   */
  generateSummary(filters = {}) {
    const endpoints = this.getPaths(filters);

    console.log('\n=== Swagger/OpenAPI Summary ===\n');
    console.log(`File: ${this.swaggerPath}`);
    console.log(`Format: ${this.isOpenAPI3 ? 'OpenAPI 3.x' : 'Swagger 2.0'}`);
    console.log(`Total Endpoints: ${endpoints.length}\n`);

    // Group by version
    const byVersion = {};
    endpoints.forEach((ep) => {
      if (!byVersion[ep.version]) {
        byVersion[ep.version] = [];
      }
      byVersion[ep.version].push(ep);
    });

    for (const [version, versionEndpoints] of Object.entries(byVersion)) {
      console.log(`\n--- Version ${version} (${versionEndpoints.length} endpoints) ---\n`);

      versionEndpoints.forEach((ep) => {
        console.log(`${ep.method.padEnd(7)} ${ep.path}`);
        if (ep.summary) {
          console.log(`        ${ep.summary}`);
        }
        if (ep.tags.length > 0) {
          console.log(`        Tags: ${ep.tags.join(', ')}`);
        }
        console.log('');
      });
    }
  }

  /**
   * Generate detailed report for a specific endpoint
   */
  generateDetailedReport(pathPattern) {
    const endpoints = this.getPaths({ path: pathPattern });

    if (endpoints.length === 0) {
      console.log(`No endpoints found matching pattern: ${pathPattern}`);
      return;
    }

    endpoints.forEach((ep) => {
      console.log('\n' + '='.repeat(80));
      console.log(`\n${ep.method} ${ep.path}`);
      console.log(`\nVersion: ${ep.version}`);
      console.log(`Summary: ${ep.summary || 'N/A'}`);
      console.log(`Tags: ${ep.tags.join(', ') || 'N/A'}`);

      // Request schema
      console.log('\n--- Request Schema ---\n');
      const requestSchema = this.getRequestSchema(ep.operation);
      if (requestSchema) {
        const requestFields = this.extractFields(requestSchema);
        if (requestFields.length > 0) {
          console.log('Fields:');
          requestFields.forEach((field) => {
            const reqStr = field.required ? '[REQUIRED]' : '[OPTIONAL]';
            console.log(`  - ${field.name.padEnd(40)} ${field.type.padEnd(15)} ${reqStr}`);
          });
        } else {
          console.log('No request body fields');
        }
      } else {
        console.log('No request body');
      }

      // Response schemas
      console.log('\n--- Response Schemas ---\n');
      const responseSchemas = this.getResponseSchemas(ep.operation);
      if (Object.keys(responseSchemas).length > 0) {
        for (const [statusCode, respSchema] of Object.entries(responseSchemas)) {
          console.log(`\nStatus ${statusCode}:`);
          const responseFields = this.extractFields(respSchema);
          if (responseFields.length > 0) {
            responseFields.forEach((field) => {
              console.log(`  - ${field.name.padEnd(40)} ${field.type}`);
            });
          } else {
            console.log('  No response body fields');
          }
        }
      } else {
        console.log('No response schemas defined');
      }

      console.log('\n');
    });
  }
}

// Command-line interface
const isMainModule = process.argv[1] && __filename === process.argv[1];
if (isMainModule) {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length > MAX_CLI_ARGS) {
    console.error(`Error: Too many CLI arguments. Maximum allowed is ${MAX_CLI_ARGS}.`);
    process.exit(1);
  }

  const args = rawArgs;

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Swagger/OpenAPI Parser Helper

Usage:
  node parse-swagger.js <swagger-file-name> [options]

Options:
  --version <version>   Filter by API version (e.g., 2.0)
  --path <pattern>      Filter by path pattern (e.g., /offers/management)
  --method <method>     Filter by HTTP method (e.g., POST, GET)
  --summary            Show only endpoint summaries
  --detailed           Show detailed field information

Examples:
  node parse-swagger.js offers-swagger.json --summary
  node parse-swagger.js offers-swagger.json --version 2.0
  node parse-swagger.js offers-swagger.json --path /management --detailed
    `);
    process.exit(0);
  }

  let swaggerPath;

  try {
    swaggerPath = resolveSwaggerPathFromArg(args[0]);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const parser = new SwaggerParser(swaggerPath);

  if (!parser.load()) {
    process.exit(1);
  }

  // Parse options
  const filters = {};
  let showDetailed = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--version':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --version requires a value');
          process.exit(1);
        }
        filters.version = args[++i];
        break;
      case '--path':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --path requires a value');
          process.exit(1);
        }
        filters.path = args[++i];
        break;
      case '--method':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --method requires a value');
          process.exit(1);
        }
        filters.method = args[++i];
        break;
      case '--summary':
        // Summary is the default behavior
        break;
      case '--detailed':
        showDetailed = true;
        break;
      default:
        if (args[i].startsWith('--')) {
          console.error(`Error: Unknown option '${args[i]}'`);
          process.exit(1);
        }
    }
  }

  if (showDetailed && filters.path) {
    parser.generateDetailedReport(filters.path);
  } else {
    parser.generateSummary(filters);
  }
}

export default SwaggerParser;
