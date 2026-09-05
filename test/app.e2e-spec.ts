import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"

describe("Scribo nest bootstrap", () => {
    it("loads the testing module metadata", async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            providers: []
        }).compile()
        const app: INestApplication = moduleFixture.createNestApplication()
        await app.init()
        await app.close()
        expect(app).toBeDefined()
    })
})
