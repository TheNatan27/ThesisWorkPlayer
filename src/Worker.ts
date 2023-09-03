import execa from 'execa';
import http from 'http';
import fs from 'fs';
import axios from 'axios';
import z from 'zod';
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
        const testId = testIdSchema.parse(response).testID;
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
    const resultData = fs.readFileSync(path.join(__dirname, './result/jres.json'), {encoding: 'utf-8'})
    try {
        const response = await axios.post(`${baseUrl}/return-test/${suiteId}/${testId}`, {
            resultData
        })
        console.log('Log: Return status - ' + response.status)
    } catch (error) {
        console.log('Error:' + error)
    }
}

async function startServer(){
    try {
        console.log('Log: Start server...');
        execa('dotnet /BUILD/EK7TKN_HFT_2021221.Endpoint.dll --urls=http://0.0.0.0:5000');

    } catch (error) {
        console.log('Error:' + error)
    }
}
