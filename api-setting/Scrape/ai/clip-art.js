/**
 * Wm: Nopal ganteng
 * hapus wm boleh tapi doakan kesahatan yang bikin
 * Jangan lupa sholat
 * Base: https://vheer.com
 * Eror chat saja ma
 * pastikan sudah menginstall puppeteer
 */
const puppeteer = require('puppeteer');

async function generateClipArt(promptText, styleType, width, height, modelType) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        const url = 'https://vheer.com/app/clip-art-generator';

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Selector definitions
        const promptInputSelector = 'textarea[placeholder="Input the clip art subject description."]';
        const generateButtonBaseSelector = 'button[type="button"]';
        const qualityModelRadioSelector = '#hs-radio-checked-in-form';
        const fastModelRadioSelector = '#hs-radio-in-form';
        const aspectRatioDropdownButtonSelector = '#hs-dropdown-default';
        const loadingOverlaySelector = 'div.absolute.inset-0.z-20';
        const generatedImageContainerSelector = 'div.bg-white.dark\\:bg-neutral-800.relative.w-full.h-full.flex.flex-col.min-h-\\[160px\\].items-center.justify-center.mx-auto.rounded-lg';
        const generatedImageSelector = `${generatedImageContainerSelector} img`;

        // Style and aspect ratio mappings
        const styleMapping = {
            1: 'Flat Design', 2: 'Minimalist', 3: 'Cartoon', 4: 'Retro',
            5: 'Outline', 6: 'Watercolor', 7: 'Isometric', 8: 'Nature',
        };
        const aspectRatioMapping = {
            '1024:1024': '1:1', '1024:2048': '1:2', '2048:1024': '2:1',
            '1024:1536': '2:3', '1536:1024': '3:2', '1024:1820': '9:16',
            '1820:1024': '16:9',
        };

        // Set model type
        const modelSelector = modelType === 1 ? qualityModelRadioSelector : fastModelRadioSelector;
        await page.waitForSelector(modelSelector, { visible: true, timeout: 30000 });
        await page.click(modelSelector);

        // Set style
        const styleName = styleMapping[styleType];
        if (styleName) {
            await page.waitForFunction(
                (name) => {
                    const styleDivs = Array.from(document.querySelectorAll('div.cursor-pointer.rounded-lg'));
                    const targetDiv = styleDivs.find(div => {
                        const h3 = div.querySelector('h3');
                        return h3 && h3.textContent.trim() === name;
                    });
                    if (targetDiv) {
                        targetDiv.click();
                        return true;
                    }
                    return false;
                },
                { timeout: 30000 },
                styleName
            );
        } else {
            return null;
        }

        // Set aspect ratio
        const targetAspectRatio = aspectRatioMapping[`${width}:${height}`] || '1:1';
        await page.waitForSelector(aspectRatioDropdownButtonSelector, { visible: true, timeout: 30000 });
        await page.click(aspectRatioDropdownButtonSelector);

        await page.waitForFunction(
            (aspectRatio) => {
                const options = Array.from(document.querySelectorAll('div.hs-dropdown-menu div.flex.items-center h3'));
                const targetOption = options.find(h3 => h3.textContent.trim() === aspectRatio);
                if (targetOption) {
                    targetOption.closest('div.flex.items-center').click();
                    return true;
                }
                return false;
            },
            { timeout: 30000 },
            targetAspectRatio
        );

        // Input prompt text
        await page.waitForSelector(promptInputSelector, { visible: true, timeout: 30000 });
        await page.focus(promptInputSelector);
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type(promptInputSelector, promptText);

        // Click generate button
        await page.waitForFunction(
            (buttonText) => {
                const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
                const targetButton = buttons.find(button =>
                    button.textContent.trim().includes(buttonText) &&
                    button.querySelector('div.inline-flex.items-center.justify-center.tracking-wide.font-semibold')
                );
                if (targetButton) {
                    targetButton.click();
                    return true;
                }
                return false;
            },
            { timeout: 30000 },
            'Generate'
        );

        // Wait for generation to complete
        await page.waitForSelector(loadingOverlaySelector, { visible: true, timeout: 30000 });
        await page.waitForSelector(loadingOverlaySelector, { hidden: true, timeout: 120000 });
        await page.waitForSelector(generatedImageSelector, { visible: true, timeout: 10000 });

        // Get generated image
        const imageUrl = await page.$eval(generatedImageSelector, img => img.src);
        const defaultImageUrl = '/_next/image?url=%2Fimages%2Fpages%2Fclip_art_generator%2Fdefault_image.webp&w=1080&q=75';

        if (imageUrl && !imageUrl.includes(defaultImageUrl) {
            if (imageUrl.startsWith('blob:')) {
                // For blob URLs
                const imageBase64 = await page.evaluate(async (url) => {
                    try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    } catch (error) {
                        return null;
                    }
                }, imageUrl);

                if (imageBase64) {
                    // Convert base64 to buffer
                    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
                    return Buffer.from(base64Data, 'base64');
                }
            } else if (imageUrl.startsWith('http')) {
                // For direct URLs
                const response = await page.goto(imageUrl);
                return await response.buffer();
            }
        }
        return null;
    } catch (error) {
        console.error('Error in generateClipArt:', error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Example usage
async function test() {
    const buffer = await generateClipArt(
        "a cute cat playing with a ball of yarn, cartoon style",
        3, // Cartoon style
        1024, // Width
        1024, // Height
        1 // Quality model
    );
    
    if (buffer) {
        console.log('Successfully got image buffer of length:', buffer.length);
        // You can save the buffer to a file or use it as needed
        // Example: fs.writeFileSync('output.png', buffer);
    } else {
        console.log('Failed to generate image');
    }
}

// Uncomment to test
// test();

module.exports = generateClipArt;
