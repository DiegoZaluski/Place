document.documentElement.style.overflow = 'hidden';
document.body.style.overflow = 'hidden';
document.documentElement.style.margin = '0';
document.body.style.margin = '0';
document.documentElement.style.padding = '0';
document.body.style.padding = '0';
document.documentElement.style.width = '100%';
document.body.style.width = '100%';
document.documentElement.style.height = 'auto';
document.body.style.height = 'auto';

const updateWindowSize = () => {
const rect = document.documentElement.getBoundingClientRect();
const width = Math.ceil(rect.width);
const height = Math.ceil(rect.height);
window.api?.sendContentSize(width, height);
};

updateWindowSize();

const resizeObserver = new ResizeObserver(updateWindowSize);
resizeObserver.observe(document.documentElement);
resizeObserver.observe(document.body);