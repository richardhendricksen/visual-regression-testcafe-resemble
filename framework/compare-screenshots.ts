import { UAParser } from 'ua-parser-js';

const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const compareImages = require('resemblejs/compareImages');

const screenshotRootDir = './screenshots/';
const baselineScreenshotDir = 'baseline/';
const testScreenshotDir = 'tests/';
const diffScreenshotDir = 'diff/';
const combinedScreenshotDir = 'combined/';

export default async (t, element): Promise<number> => {

  const userAgent = await t.eval(() => window.navigator.userAgent);
  const browserName = new UAParser().setUA(userAgent).getBrowser().name;
  const elementWidth = await element.offsetWidth;
  const elementHeight = await element.offsetHeight;

  // @ts-ignore
  const testCase = t.testRun.test.name;

  const imgName = `${testCase}_${browserName}_${elementWidth}x${elementHeight}.png`;

  const testScreenshotPath = path.resolve(screenshotRootDir, testScreenshotDir, imgName);
  const baselineScreenshotPath = path.resolve(screenshotRootDir, baselineScreenshotDir, imgName);
  const diffScreenshotPath = path.resolve(screenshotRootDir, diffScreenshotDir, imgName);
  const combinedScreenshotPath = path.resolve(screenshotRootDir, combinedScreenshotDir, imgName);

  await t.takeElementScreenshot(element, testScreenshotDir + imgName);
  const testScreenshotPNG = PNG.sync.read(fs.readFileSync(testScreenshotPath));
  const {width: testScreenshotWidth, height: testScreenshotHeight} = testScreenshotPNG;

  try {
    PNG.sync.read(fs.readFileSync(baselineScreenshotPath));
  } catch (err) {
    // no baseline, copy current value
    fs.copyFileSync(testScreenshotPath, baselineScreenshotPath);
    console.error('ERROR: No baseline present, saving current screenshot as baseline');

    return -1;
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

  const result = await compareImages(
    await fs.readFileSync(baselineScreenshotPath),
    await fs.readFileSync(testScreenshotPath),
    options
  );

  fs.writeFileSync(diffScreenshotPath, result.getBuffer());

  // write combined image to testScreenshot for reporting
  const combineTiles = require('combine-tiles');

  const tiles = [
    {x: 0, y: 0, file: baselineScreenshotPath},
    {x: 1, y: 0, file: testScreenshotPath},
    {x: 2, y: 0, file: diffScreenshotPath}
  ];

  return combineTiles(tiles, testScreenshotWidth, testScreenshotHeight, combinedScreenshotPath).then(() => {
    fs.copyFileSync(combinedScreenshotPath, testScreenshotPath);

    return result.rawMisMatchPercentage;
  })
    .catch(console.error);
};
