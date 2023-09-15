import execa from 'execa';
import http from 'http';
import fs from 'fs';
import axios from 'axios';
import z, { string } from 'zod';
import path from 'path';

const defaultServerIp = '192.168.100.8';
const serverIpAddress = process.env.IP_ADDRESS || defaultServerIp;
const suiteId = process.env.SUITE_ID;
const baseUrl = `http://${serverIpAddress}:30552`;

const testIdSchema = z.object({
    testID: z.string()
});
type TestIdMessage = z.infer<typeof testIdSchema>;

startServer();
reserveTestId();

// 1. Start server
// 2. Reserve test id
// 3. Download test script 
// 4. Execute test
// 5. Return result

async function reserveTestId() {
    try {
        const response = await axios.get(`${baseUrl}/reserve-test/${suiteId}`);
        const testId = testIdSchema.parse(response.data).testID;
        await downloadTestScript(testId);
    } catch (error) {
        console.error('Error:' + error)
    }
}

async function downloadTestScript(testId: string) {
    http.get(`${baseUrl}/request-test/${suiteId}/${testId}`, (response) => {
     const path = "./src/tests/test.spec.ts";

     fs.closeSync(fs.openSync(path, 'w'))
     const writeStream = fs.createWriteStream(path)
     response.pipe(writeStream);
     
     writeStream.on('finish', async () => {
         writeStream.close();
         console.log('Log: Test downloaded!');
         await runTest(testId)
     })
    })
}

async function runTest(testId: string){
    try {
        console.log('Log: Run test...')
        const pwrun = execa.commandSync('npx playwright test')
        console.log('Log: Playwright results...')
        console.log(pwrun.stdout)
        await returnResults(testId);
    } catch (error) {
        console.error('Error:' + error)
        await returnResults(testId);
    }
}

async function returnResults(testId: string) {
    console.log('Log: Return results...')
    console.log(`Return to: ${baseUrl}/return-test/${suiteId}/${testId}`)
    const resultData = fs.readFileSync('/WORKPLAYER/result/jres.json', {encoding: 'utf-8'})
    const server = axios.create({timeout: 60_000, maxContentLength: 500*1000*1000, httpAgent: new http.Agent({keepAlive: true})})
    try {
        const response = await server.post(`${baseUrl}/return-test/${suiteId}/${testId}`, {
            resultData
        }, { headers: {
            "Content-Type": 'application/json'
        }})
        console.log('Log: Return status - ' + response.status)
    } catch (error) {
        console.log('Return error:' + error)
    }
}

async function startServer(){
    try {
        console.log('Log: Start server...');
        const stdout = execa('dotnet', ['/BUILD/EK7TKN_HFT_2021221.Endpoint.dll', '--urls=http://0.0.0.0:5000'], {detached: true}).stdout?.pipe(process.stdout);
        //const stdout = execa('dotnet --info', {detached: true}).stdout?.pipe(process.stdout);
    } catch (error) {
        console.log('Error:' + error)
    }
}
