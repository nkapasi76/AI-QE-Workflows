<!-- ---
description: 'Guidelines for writing TypeScript code with Jest for integration and E2E testing'
applyTo: '**/*.ts, **/*.js, **/*.test.ts, **/*.spec.ts'
--- -->

# TypeScript Jest Testing Project Guidelines

## Coding Standards

- Use **TypeScript** with strict type checking and ES2022+ features to avoid type errors
- Use **ES6 modules** (type: "module" in package.json) with import/export statements
- Import dependencies using **ES6 standard**: `import { createCustomer } from "lib/apis"`
- Use **async/await** for asynchronous operations instead of `.then()` for better readability
- Use **arrow functions** `(params) => { //code }` for better readability and to keep `this` bound to test context
- Prefer explicit typing over `any` - use proper TypeScript types
- Never use `null`, always use `undefined` for optional values
- Keep code small, readable, and maintainable with reusable assets in library files

## Project Structure & Organization

- `tests/` - Contains all test files with `.test.ts` extension
- `lib/` - Reusable library assets:
  - `lib/apis/` - API requests grouped by domain/Swagger structure
  - `lib/common/` - Axios client definitions and other services
  - `lib/interfaces/` - TypeScript types and interfaces (one file per domain)
  - `lib/test-data/` - Test data helpers grouped by domain
  - `lib/reporter/` - TestRail reporter scripts
- `envs/` - Environment variable configurations

## Testing Framework & Execution

- Use Jest with TypeScript support via ts-jest
- Execute tests with `--runInBand` to avoid concurrency issues
- Support both integration and E2E testing patterns
- Use `npm run typecheck` before running tests
- Cross-platform support: Windows PowerShell (`$env:TESTRAIL_CONFIG="qa190.q"`) and Linux/Mac (`export TESTRAIL_CONFIG="qa190.q"`)

## Test File Structure & Naming

- All Jest tests live under `tests/` folder with `.test.ts` extension
- One test file typically represents one test suite
- Use TestRail case IDs in test names: `'C5897077 Test Description'`
- Separate E2E preparation tests (`prep.test.ts`) from main test execution (`e2e:test`)

## Jest Test Organization Patterns

```typescript
import { OfferData, CustomerData } from 'lib/test-data';
import { OfferManagementAPI, OfferRedemptionAPI } from 'lib/apis';

describe('<TestSuiteTitle>', () => {
  // Variables used in the entire test suite
  let offerId: string;
  let customerId: string;

  beforeAll(async () => {
    // Preparation steps (equivalent to Postman "Preparation" folder)
    const offer = OfferData.getTestOffer();
    offer.title = `${testDataPrefix} Some Title`; // Use global testDataPrefix
    const response = await OfferManagementAPI.createOffer(offer);
    offerId = response.data.payload.offer_id;
  });

  afterAll(async () => {
    // Cleanup steps (equivalent to Postman "Cleanup" folder)
    await OfferManagementAPI.deactivateOffer(offerId);
  });

  test('C12345 Test Description', async () => {
    // Test equivalent to one Postman request
    const redeemResponse = await OfferRedemptionAPI.manuallyRedeemOffer(customerId, offerId);

    // Assertions (equivalent to Postman "Tests" tab)
    expect(redeemResponse.status).toBe(200);
    // Additional assertions...
  });
});
```

## Advanced Test Patterns

### Nested Test Organization

```typescript
describe('<TestSuiteTitle>', () => {
  describe('Happy Path', () => {
    test('C12345 Test Description', async () => {
      // Happy path test
    });
  });

  describe('Validation', () => {
    test('C12346 Test Description', async () => {
      // Validation test
    });
  });
});
```

### Parameterized Tests

```typescript
test.each([
  { example: '45a44080-7e6e-11ee-90c2-9efda583de89' },
  { example: 'a9d5537e-b0c7-11ee-9463-86e721311cbd' },
])('C5897077 Test Description for $example', async ({ example }) => {
  // Test logic with parameter
});
```

## Library Development Guidelines

### API Library Structure (`lib/apis/`)

- Group API requests by domain in separate folders
- Each API function should have detailed JSDoc comments with `@endpoint`, `@params`, and `@returns`
- Use TypeScript interfaces for request/response types
- Export functions through `lib/apis/index.ts` for clean imports

```typescript
/**
 * Creates a new offer
 * @endpoint /api/2.0/offers/management/create
 * @param offer Offer config
 * @returns API request promise
 */
export const createOffer = (offer: Offer) => {
  const request: CreateOfferRequest = {
    retailer_id: process.env.RETAILER_ID,
    culture: 'en-US',
    ...offer,
  };

  return OffersApiClient.post<CreateOfferResponse>('/api/2.0/offers/management/create', request);
};
```

### Test Data Library (`lib/test-data/`)

- Create reusable test data generators for complex payloads
- Use factory functions that return configured objects
- Support customization in test preparation steps
- Use timestamps for unique identifiers

```typescript
export const createCustomer = (): Customer => {
  const timestamp: number = dayjs().unix();

  return {
    opted_in: 'true',
    email: `smtest_user_${timestamp}@example.com`,
    external_id: `SMTEST_USER_${timestamp}`,
    first_name: `${testDataPrefix} Customer`,
    last_name: `Test ${timestamp}`,
  };
};
```

### TypeScript Interfaces (`lib/interfaces/`)

- One interface file per domain
- Define interfaces for all API requests and responses
- Export through `lib/interfaces/index.ts`
- Ensure type safety across the entire test suite

### Axios Clients (`lib/common/`)

- Create domain-specific Axios clients with proper authentication
- Use environment variables for URLs and credentials
- Support different authentication methods (basic auth, API keys, etc.)

```typescript
export const OffersApiClient = createClient(process.env.CONNECT_OFFERS_URL, {
  username: process.env.CONNECT_API_KEY,
  password: process.env.CONNECT_API_SECRET,
});
```

## Environment & Configuration

- Use `.env.user.config` for local user-specific configuration
- Support TESTRAIL_CONFIG environment variable for test environment selection
- Use dotenv for environment variable management
- Configure AWS profiles through AWS_PROFILE variable
- Support SSH jumphost configuration for database access

## TestRail Integration

- Test case IDs must match those defined in `.test.ts` files
- Support custom branch specification: `[branch:yourname/branch]`
- Automatic test result reporting to TestRail
- Test plan creation under "End To End Scenarios suite"

## E2E Test Execution Pattern

```bash
npm run e2e:prep    # Run preparation tests
# Wait ~30 minutes for platform cache
npm run e2e:test    # Run actual E2E tests
```

## Dependencies & External Services

- AWS SDK v3 for AWS service interactions
- Axios with custom clients for API testing
- MySQL2 and MSSQL for database testing
- SSH2 for secure database connections
- Faker.js for generating realistic test data
- dayjs/moment for date/time operations
- Zod for runtime type validation
- TestRail API client for test management

## Assertions & Validation

- Use Jest `expect()` function for all assertions
- Use Jest extended matchers for enhanced assertions
- Test both happy path and error scenarios
- Validate response status codes: `expect(response.status).toBe(200)`
- Use meaningful assertion messages

## Best Practices

- Keep tests small, readable, and focused on behavior
- Use global `testDataPrefix` for test data identification
- Clean up all created test data in `afterAll` hooks
- Handle async operations properly with async/await
- Use descriptive variable and function names
- Group reusable assets in library files to avoid duplication
- Write detailed JSDoc comments for library functions

## Documentation & Resources

- **SessionM Product Documentation**: https://docs.sessionm.com/home.htm - Complete product documentation including platform features, modules, and user guides
- **SessionM Developer Documentation**: https://docs.sessionm.com/developer/home.htm - API documentation, integration guides, SDK references, and technical implementation details
- **SessionM Learning Hub**: https://learn.sessionm.com/pages/sessionm-developers-center - New developer center with updated content (some content has moved here from the main developer docs)
- **Environment-Specific API Documentation**:

### Go lang Services

- **Audience Generator**: `https://aud-gen-coord.{environment}.{tier}.local/swagger-ui.html`
- **SM-SYNC (ETL Coordinator)**: `https://etl-coordinator.{environment}.{tier}.local/web/v1/docs`
- **Timeline Services**: Timeline APIs documentation
  - Host: `https://timeline-rest.{environment}.{tier}.local`
- **Messaging Services**: Messaging API 1.3 documentation
  - Host: `https://messaging-apid.{environment}.{tier}.local`
- **Audience Export Services**: Internal REST API documentation
  - Host: `https://audience-export-apid.{environment}.{tier}.local`

### Connect Services (Domains with Swagger)

`https://domains-{environment}.{tier}-sessionm.com/{service}/swagger/ui/index` - Interactive API documentation per environment and service

- **Available Connect Services**:
  - `transactions` - Transaction processing, items, payments, and point economy operations
  - `incentives` - Loyalty points system, rules engine, and custom loyalty programs
  - `offers` - Offer management, rewards, fulfillment methods, and restrictions
  - `catalog` - Master catalog management, store categories, and items normalization
- **Examples by Tier**:
  - QA: `https://domains-qa160.q-sessionm.com/transactions/swagger/ui/index`
  - Staging: `https://domains-connecteast1.stg-sessionm.com/offers/swagger/ui/index`
  - Enterprise: `https://domains-connecteast1.ent-sessionm.com/incentives/swagger/ui/index`

### Composer / Insights Services Swagger

`https://composer.{tier}-sessionm.com/docs/` - Composer-based service documentation

- Enterprise: `https://composer.ent-sessionm.com/docs/`

## User Interactions

- Ask questions if unsure about implementation details or testing strategy
- Clarify whether tests should be integration or E2E level
- Confirm external service dependencies and expected behavior
- Always answer in the same language as the question, but use English for generated content
