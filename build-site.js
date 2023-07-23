const { dir } = require('console');
const fs = require('fs');
const path = require('path');

const INPUT_FOLDER = "content";
const OUTPUT_FOLDER = ".build";
const TEMPLATE_FILE = "template.html";

const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

async function renderDirectory(directoryPath) {    
  console.log(directoryPath);
  if (!fs.existsSync(`${OUTPUT_FOLDER}/${directoryPath}`)) {
    fs.mkdirSync(`${OUTPUT_FOLDER}/${directoryPath}`);
  }

  const files = await fs.promises.readdir(`${INPUT_FOLDER}/${directoryPath}`);

  files.forEach(async file => {
    const stat = fs.lstatSync(`${INPUT_FOLDER}/${directoryPath}/${file}`);
    if (stat.isDirectory()) {
      await renderDirectory(`${directoryPath}/${file}`);
    } else {
      if (file === 'index.html' || file === 'index.md') {
        await renderIndex(`${directoryPath}/${file}`, files);
      } else {
        await renderFile(`${directoryPath}/${file}`);
      }
    }
  })
}

async function renderIndex(filePath, files) {
  console.log(filePath);
  const fileContents = fs.readFileSync(`${INPUT_FOLDER}/${filePath}`, 'utf8');
  let renderedFile = template.replace(/\{BODY\}/g, fileContents);

  const imageFiles = files.filter(file => [".jpg", ".jpeg", ".png"].includes(path.extname(file)))
  const otherFiles = files.filter(file => ![".jpg", ".jpeg", ".png"].includes(path.extname(file)))

  const imageList = renderGallery(imageFiles);
  const fileList = otherFiles.map(file => `<li><a href="${file}">${file}</a></li>`).join("\n");

  const allFiles = imageList + fileList;

  renderedFile = renderedFile.replace(/\{FILES\}/g, allFiles);

  const extension = path.extname(filePath);
  const fileName = path.basename(filePath, extension);
  const directory = path.dirname(filePath);
  fs.writeFileSync(`${OUTPUT_FOLDER}/${directory}/${fileName}.html`, renderedFile);
}

async function renderFile(filePath) {
  console.log(filePath);
  const extension = path.extname(filePath);
  const directory = path.dirname(filePath);
  if (extension === 'md' || extension === 'html') {
    const fileContents = fs.readFileSync(`${INPUT_FOLDER}/${filePath}`, 'utf8');
    const renderedFile = template.replace(/\{BODY\}/g, fileContents);  
    const fileName = path.basename(filePath, extension);
    fs.writeFileSync(`${OUTPUT_FOLDER}/${directory}/${fileName}.html`, renderedFile);
  } else {
    fs.copyFileSync(`${INPUT_FOLDER}/${filePath}`, `${OUTPUT_FOLDER}/${filePath}`); 
  }
}

function renderGallery(images) {
  console.log(images);
  const imageList = images.map(image => `<img src="${image}">`);
  return imageList.join("\n");
}

renderDirectory('');
