import execa, { ExecaChildProcess } from 'execa';
import http from 'http';
import fs from 'fs';
import axios from 'axios';
import z, { string } from 'zod';
import path from 'path';
var spawn = require('child_process').spawn;

const defaultServerIp = '192.168.100.8';
const serverIpAddress = process.env.IP_ADDRESS || defaultServerIp;
const suiteId = process.env.SUITE_ID;
const baseUrl = `http://${serverIpAddress}:30552`;

const testIdSchema = z.object({
    testID: z.string()
});
type TestIdMessage = z.infer<typeof testIdSchema>;

reserveTestId();

// 1. Start server
// 2. Reserve test id
// 3. Download test script 
// 4. Execute test
// 5. Return result

async function reserveTestId() {
    const dotnetServer = startServer();
    try {
        const response = await axios.get(`${baseUrl}/reserve-test/${suiteId}`);
        const testId = testIdSchema.parse(response.data).testID;
        await downloadTestScript(testId, dotnetServer);
    } catch (error) {
        console.error('Error:' + error)
        stopServer(dotnetServer)
    }
}

async function downloadTestScript(testId: string, dotnetServer: number) {
    http.get(`${baseUrl}/request-test/${suiteId}/${testId}`, (response) => {
     const path = "./src/tests/test.spec.ts";

     fs.closeSync(fs.openSync(path, 'w'))
     const writeStream = fs.createWriteStream(path)
     response.pipe(writeStream);
     
     writeStream.on('finish', async () => {
         writeStream.close();
         console.log('Log: Test downloaded!');
         await runTest(testId, dotnetServer)
     })
    })
}

async function runTest(testId: string, dotnetServer: number){
    try {
        console.log('Log: Run test...');
        const pwrun = execa.commandSync('npx playwright test');
        console.log('Log: Playwright results...');
        console.log(pwrun.stdout);
        await returnResults(testId, dotnetServer);
    } catch (error) {
        console.error('Error:' + error)
        await returnResults(testId, dotnetServer);
    }
}

async function returnResults(testId: string, dotnetServer: number) {
    stopServer(dotnetServer)
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

function startServer(): number{
    console.log('Log: Start server...');
    const dotnetServer = execa('dotnet', ['/BUILD/EK7TKN_HFT_2021221.Endpoint.dll', '--urls=http://0.0.0.0:5000'], {detached: true});
    dotnetServer.stdout?.pipe(process.stdout)
    console.log(`Serverdata: ${dotnetServer}`)
    console.log(`PID: ${dotnetServer.pid}`)
    return dotnetServer.pid!;
    //const stdout = execa('dotnet --info', {detached: true}).stdout?.pipe(process.stdout);
}

function stopServer(serverPid: number) {
    console.log(`Kill process: ${serverPid}`);
    process.kill(serverPid)
}
