import { createCanvas, loadImage } from 'canvas';
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import Config from './config';

const compareImages = require('resemblejs/compareImages');

const screenshotRootDir = 'screenshots/';
const baselineScreenshotDir = 'baseline/';
const actualScreenshotDir = 'tests/';
const diffScreenshotDir = 'diff/';

function createDirectoryIfNotExists(dir: string): void {
    if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true});
    }
}

async function combineReportImage(t: TestController, baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
    const baselineImage = await loadImage(baselineScreenshotPath);
    const testImage = await loadImage(testScreenshotPath);
    const diffImage = await loadImage(diffScreenshotPath);

    const {width, height} = baselineImage;

    const canvas = createCanvas(width * 3, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(baselineImage, 0, 0, width, height);
    ctx.drawImage(testImage, width, 0, width, height);
    ctx.drawImage(diffImage, 2 * width, 0, width, height);

    // add header
    ctx.font = '18px Impact';
    ctx.fillText('Baseline', 0, 15);
    ctx.fillText('Actual', width, 15);
    ctx.fillText('Diff', width * 2, 15);

    ctx.fillText(`Browser: ${t.browser.name}/${t.browser.os.name}`, 0, 30);

    const out = createWriteStream(testScreenshotPath);
    const stream = canvas.createPNGStream();

    stream.pipe(out);

    return new Promise((res, rej) => {
        out.on('finish', res);
        out.on('error', (err) => {
            rej(err);
            out.close();
        });
        stream.on('error', (err) => {
            rej(err);
            out.close();
        });
    });
}

export async function compareElementScreenshot(t: TestController, element: Selector, feature: string): Promise<any> {
    // @ts-ignore
    const testCase = t.testRun.test.name;

    const imgName = `${testCase}_${t.browser.name}_${t.browser.os.name}.png`;

    createDirectoryIfNotExists(resolve(screenshotRootDir, actualScreenshotDir, feature));
    createDirectoryIfNotExists(resolve(screenshotRootDir, baselineScreenshotDir, feature));
    createDirectoryIfNotExists(resolve(screenshotRootDir, diffScreenshotDir, feature));

    const actualScreenshotPath = resolve(screenshotRootDir, actualScreenshotDir, feature, imgName);
    const baselineScreenshotPath = resolve(screenshotRootDir, baselineScreenshotDir, feature, imgName);
    const diffScreenshotPath = resolve(screenshotRootDir, diffScreenshotDir, feature, imgName);

    await t.takeElementScreenshot(element, actualScreenshotDir + feature + '/' + imgName);

    if (!existsSync(baselineScreenshotPath)) {
        copyFileSync(actualScreenshotPath, baselineScreenshotPath);
        await t.expect('no baseline').notOk('No baseline present, saving actual element screenshot as baseline');
    }

    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 0,
                blue: 255
            },
            errorType: 'movement',
            outputDiff: true
        },
        scaleToSameSize: true,
        ignore: 'antialiasing'
    };

    // compare images
    const result = await compareImages(
        await readFileSync(baselineScreenshotPath),
        await readFileSync(actualScreenshotPath),
        options
    );

    writeFileSync(diffScreenshotPath, result.getBuffer());

    // write combined image to testScreenshot for reporting
    await combineReportImage(t, baselineScreenshotPath, actualScreenshotPath, diffScreenshotPath);

    return {
        areEqual: result.rawMisMatchPercentage <= Config.MAX_DIFF_PERC,
        errorMessage: `Element screenshot difference greater then max diff percentage: expected ${result.rawMisMatchPercentage} to be less or equal to ${Config.MAX_DIFF_PERC}`
    };
}
