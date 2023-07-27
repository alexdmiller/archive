const { dir } = require('console');
const fs = require('fs');
const path = require('path');

const INPUT_FOLDER = "content";
const OUTPUT_FOLDER = ".build";
const TEMPLATE_FILE = "template.html";
const CSS_FILE = "style.css";
const IGNORE = ['index.md', 'index.html', '.DS_Store'];

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
  });

  fs.copyFileSync(CSS_FILE, `${OUTPUT_FOLDER}/${CSS_FILE}`);
}

async function renderIndex(filePath, files) {
  console.log(filePath);
  const fileContents = fs.readFileSync(`${INPUT_FOLDER}/${filePath}`, 'utf8');
  let renderedFile = template.replace(/\{BODY\}/g, fileContents);

  const allImageFiles = files.filter(file => [".jpg", ".jpeg", ".png"].includes(path.extname(file)));

  const specialImageFiles = allImageFiles.filter(file => file.includes("+special"));
  const normalImageFiles = allImageFiles.filter(file => !file.includes("+special"));

  const otherFiles = files
    .filter(file => ![".jpg", ".jpeg", ".png"].includes(path.extname(file)))
    .filter(file => !IGNORE.includes(path.basename(file)))

  const specialImageList = renderGallery(specialImageFiles, "special");
  const imageList = renderGallery(normalImageFiles);
  const fileList = otherFiles.map(file => `<li><a href="${file}">${file}</a></li>`).join("\n");

  const allFiles = specialImageList + imageList + fileList;

  const breadCrumb = renderBreadCrumbs(filePath, true);

  renderedFile = renderedFile.replace(/\{FILES\}/g, allFiles);
  renderedFile = renderedFile.replace(/\{BREADCRUMB\}/g, breadCrumb);

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
    const breadCrumb = renderBreadCrumbs(filePath);

    let renderedFile = template.replace(/\{BODY\}/g, fileContents);
    renderedFile = renderedFile.replace(/\{BREADCRUMB\}/g, breadCrumb);

    const fileName = path.basename(filePath, extension);
    fs.writeFileSync(`${OUTPUT_FOLDER}/${directory}/${fileName}.html`, renderedFile);
  } else {
    fs.copyFileSync(`${INPUT_FOLDER}/${filePath}`, `${OUTPUT_FOLDER}/${filePath}`); 
  }
}

function renderGallery(images, className) {
  if (images.length === 0) {
    return "";
  }

  className = className ?? "";
  const imageList = images.map(image => `<div class='image ${className}' ><a href='${image}'><img src='${image}'></a></div>`);
  return `
    <div class='image-gallery ${className}'>
      ${imageList.join("\n")}
    </div>
  `;
}

function renderBreadCrumbs(filePath, skipLast=false) {
  const parts = filePath.split("/");
  let list = "";
  const length = skipLast ? parts.length - 1 : parts.length;
  list += `<li><a href="/">home</a></li>`;
  for (let i = 1; i < length; i++) {
    const url = parts.slice(0, i).join("/");
    list += `<li><a href="${url}">${parts[i]}</a></li>`;
  }
  return `<ul>${list}</ul>`
}

renderDirectory('');
