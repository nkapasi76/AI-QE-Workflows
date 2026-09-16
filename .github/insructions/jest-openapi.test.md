<!-- ---
description: 'Guidelines for writing TypeScript code with Jest for integration and E2E testing using OpenAPI'
applyTo: '**/*.test.ts, **/*.spec.ts'
--- -->

<!--
Something iteresting regarding OpenAPI > MCP
https://github.com/jedisct1/openapi-mcp
https://jedisct1.github.io/openapi-mcp/
https://www.speakeasy.com/mcp/building-servers/optimizing-openapi
<!-- applyTo: '**/*.ts, **/*.js, **/*.test.ts, **/*.spec.ts' -->

# TypeScript Jest Testing Project Guidelines

## Coding Standards

- Use **TypeScript** with strict type checking and ES2022+ features to avoid type errors
- Use **ES6 modules** (type: "module" in package.json) with import/export statements
- Import dependencies using **ES6 standard**: `import { V2OffersManagementFactory } from 'src/clients/offers/factory/V2OffersManagementFactory';`
- Use **async/await** for asynchronous operations instead of `.then()` for better readability
- Use **arrow functions** `(params) => { //code }` for better readability and to keep `this` bound to test context
- Prefer explicit typing over `any` - use proper TypeScript types
- Never use `null`, always use `undefined` for optional values
- Keep code small, readable, and maintainable with reusable assets in source files
- Don't use as example the tests that import from `lib/` folder. Only follow the standards in the tests that import from `src/` folder.
- DO NOT EVER import anything from `lib/` folder
- You cannot access the `lib/` folder. You can use only imports from `src/` folder.

## Project Structure & Organization

- `tests/` - Contains all test files with `.test.ts` extension
  - `tests/integration/` - Contains all integration test files with `.test.ts` extension grouped by domain/Swagger structure
  - `tests/triggers/` - Contains all end-to-end test files with `.test.ts` extension grouped by the triggering event
- `src/` - Reusable source assets:
  - `src/clients/` - API requests based on OpenAPI standard grouped by domain/Swagger structure
- `envs/` - Environment variable configurations

## Testing Framework & Execution

- Use Jest with TypeScript support via ts-jest
- Execute tests with `--runInBand` to avoid concurrency issues
- Support both integration and E2E testing patterns
- Use `npm run typecheck` before running tests
- Cross-platform support: Windows PowerShell (`$env:TESTRAIL_CONFIG="qa190.q"`) and Linux/Mac (`export TESTRAIL_CONFIG="qa190.q"`)
- Use only command line to run the tests

## Test File Structure & Naming

- All Jest tests live under `tests/` folder with `.test.ts` extension
- One test file typically represents one test suite
- Use Tags in description names: `'Test Suite Description tgt-core feat-bdo'`
- Don't prefix Tags with `@`
- Use TestRail case IDs in test names: `'tc-5897077 Test Description'`
- Use beforeAll and afterAll hooks for setup and teardown
- Add meaningful test descriptions
- Add the description of the test suite at the beginning of the file in gherkin syntax
- Don't use `.prep.ts` files. Use beforeAll hooks for setup.
- Don't use `.scenarios.ts` files. Use individual test files for each scenario.

## Jest Test Organization Patterns

```typescript
import { DeepPartial } from 'src/commons/utils/utility.types';
import {
  SMOffersDomainDTOCreateOfferRequest,
  SMOffersDomainDTORedeemUserOfferRequest,
} from 'src/gen/clients/offers-gen/types';
import { V3MasterCatalogFactory } from 'src/clients/catalog/factory/V3MasterCatalogFactory';
import { V2OffersAcquisitionFactory } from 'src/clients/offers/factory/V2OffersAcquisitionFactory';
import { V2OffersManagementFactory } from 'src/clients/offers/factory/V2OffersManagementFactory';
import { V2OffersRedemptionFactory } from 'src/clients/offers/factory/V2OffersRedemptionFactory';
import { V2OffersRedemptionService } from 'src/clients/offers/routes/V2OffersRedemptionService';
import { V3EnqueueCatalogJobsFactory } from 'src/clients/catalog/factory/V3EnqueueCatalogJobsFactory';
import { SMCatalogDomainDTOV3RequestsGetMasterCatalogV3Request } from 'src/gen/clients/catalog-gen/types';

describe(`tgt-offers feat-offers-reedem`, () => {
  let offersService: V2OffersRedemptionService;
  let factory: V2OffersRedemptionFactory;
  let itemPosKey1: string;
  let itemPosKey2: string;
  let offerCreateOverride: DeepPartial<SMOffersDomainDTOCreateOfferRequest>;

  beforeAll(async () => {
    offersService = new V2OffersRedemptionService();
    factory = new V2OffersRedemptionFactory(offersService);
    await V3EnqueueCatalogJobsFactory.ingestDefaultProductCatalog();

    const override: DeepPartial<SMCatalogDomainDTOV3RequestsGetMasterCatalogV3Request> = {
      take: 2,
    };

    const catalogResponse = await V3MasterCatalogFactory.staticGetCatalog('product', override);

    itemPosKey1 = catalogResponse[0].getExternalIds(1).getId();
    itemPosKey2 = catalogResponse[1].getExternalIds(1).getId();

    offerCreateOverride = {
      publish: true,
      common_config: {
        acquisition_start_date: '2020-03-09T10:11:30.307Z',
      },
      offer_config: {
        type: 'fixed_amount_check_discount',
        amount: 1.0,
        buy_count: 1,
        recurrence: 2,
      },
    } as any;
  });

  it(`tc-C1509239 Redeem offer for a user`, async () => {
    const createOffer = await V2OffersManagementFactory.staticCreateOffer(offerCreateOverride);

    const offerId = createOffer.getOfferId();
    const userId = crypto.randomUUID();

    const issueOffer = await V2OffersAcquisitionFactory.issueOfferStatic(userId, offerId);
    const userOfferId = issueOffer.getStatusList().getUserOfferId();

    const overrides: DeepPartial<SMOffersDomainDTORedeemUserOfferRequest> = {
      user_offer_id: userOfferId,
      transaction: {
        items: [
          {
            pos_item_key: itemPosKey1,
            pos_cat_key: 'ALL',
            quantity: 1,
            item_amount: 10,
            modifier_amount: 0,
            discount_amount: 0,
            tax_included_amount: 0.7,
            order_date: '2020-09-01T14:54:29.5715897Z',
            is_void: false,
            is_bx_gy_consumed: false,
            sub_total: 10,
            external_line_item_id: '0',
          },
          {
            pos_item_key: itemPosKey2,
            pos_cat_key: 'ALL',
            quantity: 1,
            item_amount: 1,
            modifier_amount: 0,
            discount_amount: 0,
            tax_included_amount: 0.07,
            order_date: '2020-09-01T14:54:29.5715897Z',
            is_void: false,
            is_bx_gy_consumed: false,
            sub_total: 1,
            external_line_item_id: '1',
          },
        ],
      },
    };

    await factory.reedemOffer(overrides);

    const reedemedOffer = factory.getReedemedOffer();
    const expectedMessage =
      'FixedAmountDiscountOffer passes satisfying the purchase of 1 items. Offer was applied to the check 2 times.';
    expect(reedemedOffer.getMessage()).toBe(expectedMessage);
    expect(reedemedOffer.getOfferId()).toBe(offerId);
    expect(reedemedOffer.getUserOfferId()).toBe(userOfferId);
    expect(reedemedOffer.getUserId()).toBe(userId);
  });
});
```

## Advanced Test Patterns

### Nested Test Organization

```typescript
describe('<TestSuiteTitle> tgt-core feat-bdo feat-multiorg', () => {
  describe('Happy Path tgt-core feat-bdo', () => {
    test('tc-12345 Test Description', async () => {
      // Happy path test
    });
  });

  describe('Validation tgt-core feat-bdo feat-multiorg', () => {
    test('tc-12346 Test Description', async () => {
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
])('tc-5897077 Test Description for $example', async ({ example }) => {
  // Test logic with parameter
});
```

## Development Guidelines

### API Source Structure (`src/clients/`)

- Never add business logic to API clients
- The API requests are organized by domain in separate folders
- Each domain contains auth and factories. It can contain routes and types
- If any implementation is missing from `src/clients/`, report back and pause the execution
- In case of migration from Postman, if any implementation in the Postman collection goes against the API Source Structure from `src/clients/`, report back and pause the execution

**Auth Example:**

```typescript
import { BaseClient } from 'src/clients/BaseClient';

export class OffersClient extends BaseClient {
  constructor() {
    const baseURL = process.env.CONNECT_OFFERS_URL;
    const key = process.env.CONNECT_API_KEY;
    const secret = process.env.CONNECT_API_SECRET;
    const codedToken = Buffer.from(`${key}:${secret}`).toString('base64');

    super(baseURL, {
      headers: {
        Authorization: `Basic ${codedToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
```

**Factory Example:**

```typescript
import { DeepPartial } from 'src/commons/utils/utility.types';
import { applyOverrides } from 'src/commons/utils/payload-utils';
import {
  SMCommonDTODomainResponseSMOffersDomainDTOIssueOfferResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTOIssueMultipleOffersBulkRequest,
  SMOffersDomainDTOIssueOfferResponse,
} from 'src/gen/clients/offers-gen/types';
import { V2OffersAcquisitionService } from '../routes';
import { V2OffersIssueModelResponseModel } from '../types';
import { getIssueMultipleBulkRequest } from '../data';

export class V2OffersAcquisitionFactory {
  constructor(private service = new V2OffersAcquisitionService()) {}

  private static acquisitionService = new V2OffersAcquisitionService();

  private issueMultipleBulkResponse: SMCommonDTODomainResponseSMOffersDomainDTOIssueOfferResponseSMCommonDTOIErrorResponse;
  private issuedOffer: SMOffersDomainDTOIssueOfferResponse;

  public async issueMultipleBulkOffer(
    overrides?: Record<string, any>,
    fullOverride?: boolean,
    expectedStatus: number = 200,
  ) {
    let payload = getIssueMultipleBulkRequest();
    payload = applyOverrides(payload, overrides, fullOverride);

    const response = await this.service.acquisitionV2IssueMultipleOffersBulk(payload);

    if (response.status !== expectedStatus) {
      this.issueMultipleBulkResponse = response.data;

      throw new Error(`Issue multiple bulk offer failed with status ${response.status}`);
    }

    this.issueMultipleBulkResponse = response.data;
    this.issuedOffer = this.issueMultipleBulkResponse.payload;
  }

  static async issueOfferStatic(
    userId: string,
    offerId: string,
  ): Promise<V2OffersIssueModelResponseModel> {
    const factory = new V2OffersAcquisitionFactory(this.acquisitionService);

    const overrides: DeepPartial<SMOffersDomainDTOIssueMultipleOffersBulkRequest> = {
      user_id: userId,
      offers_to_issue: [
        {
          offer_id: offerId,
          quantity: 1,
        },
      ],
    };

    await factory.issueMultipleBulkOffer(overrides);

    return factory.getIssuedOffer();
  }

  public getIssuedOffer(): V2OffersIssueModelResponseModel {
    const issuedOffer = this.issuedOffer;
    return issuedOffer ? new V2OffersIssueModelResponseModel(issuedOffer) : undefined;
  }

  public getIssueMutipleBulkResponse(): SMCommonDTODomainResponseSMOffersDomainDTOIssueOfferResponseSMCommonDTOIErrorResponse {
    return this.issueMultipleBulkResponse;
  }
}
```

**Routes Example:**

```typescript
import { OffersClient } from '../auth/OffersClient';
import {
  SMOffersDomainDTOCreateOfferRequest,
  SMCommonDTODomainResponseSMOffersDomainDTOCreateOfferResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTODeleteOfferRequest,
  SMCommonDTODomainResponseSMOffersDomainDTODeleteOfferResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTODeactivateOfferRequest,
  SMCommonDTODomainResponseSMOffersDomainDTODeactivateOfferResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTODeactivateParentOffersRequest,
  SMCommonDTODomainResponseSMOffersDomainDTODeactivateParentOffersResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTOReactivateParentOffersRequest,
  SMCommonDTODomainResponseSMOffersDomainDTOReactivateParentOffersResponseSMCommonDTOIErrorResponse,
  SMOffersDomainDTOGetParentActivationChainRequest,
  SMCommonDTODomainResponseSMOffersDomainDTOGetParentActivationChainResponseSMCommonDTOIErrorResponse,
} from 'src/gen/clients/offers-gen/types';

export class V2OffersManagementService {
  private readonly client: OffersClient;

  constructor(client?: OffersClient) {
    this.client = client ?? new OffersClient();
  }

  public async managementV2CreateOffer(request: SMOffersDomainDTOCreateOfferRequest): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTOCreateOfferResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/create`,
      request,
    );
    return { data, status, headers };
  }

  public async managementV2DeleteOffer(request: SMOffersDomainDTODeleteOfferRequest): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTODeleteOfferResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/delete`,
      request,
    );
    return { data, status, headers };
  }

  public async managementV2DeactivateOffer(
    request: SMOffersDomainDTODeactivateOfferRequest,
  ): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTODeactivateOfferResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/deactivate`,
      request,
    );
    return { data, status, headers };
  }

  public async managementV2DeactivateParentOffers(
    request: SMOffersDomainDTODeactivateParentOffersRequest,
  ): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTODeactivateParentOffersResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/deactivate_parents`,
      request,
    );
    return { data, status, headers };
  }

  public async managementV2ReactivateParentOffers(
    request: SMOffersDomainDTOReactivateParentOffersRequest,
  ): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTOReactivateParentOffersResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/reactivate_parents`,
      request,
    );
    return { data, status, headers };
  }

  public async managementV2GetParentActivationChain(
    request: SMOffersDomainDTOGetParentActivationChainRequest,
  ): Promise<{
    data: SMCommonDTODomainResponseSMOffersDomainDTOGetParentActivationChainResponseSMCommonDTOIErrorResponse;
    status: number;
    headers: any;
  }> {
    const { data, status, headers } = await this.client.post(
      `/api/2.0/offers/management/get_parent_activation_chain`,
      request,
    );
    return { data, status, headers };
  }
}
```

**Types Example:**

```typescript
import { SMOffersDomainDTOOfferTextDTO } from 'src/gen/clients/offers-gen/types';

export class V2OffersOfferTextModel {
  constructor(private offerText: SMOffersDomainDTOOfferTextDTO) {}

  public getTextId(): string {
    return this.offerText.id;
  }

  public getOfferId(): string {
    return this.offerText.offer_id;
  }

  public getCulture(): string {
    return this.offerText.culture;
  }

  public getTitle(): string {
    return this.offerText.title;
  }

  public getDescription(): string {
    return this.offerText.description;
  }

  public getTerms(): string {
    return this.offerText.terms;
  }
}
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
- Add the description of the test at the beginning of the file in gherkin syntax
- DO NOT EVER import anything from `lib/` folder. Use only imports from `src/` folder.

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
  - QA: `https://domains-qa120.q-sessionm.com/transactions/swagger/ui/index`
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
