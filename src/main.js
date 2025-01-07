import BimViewer from './BimViewer.js'

main();
async function main() {
    const bimViewer = new BimViewer({
        canvasId: 'view3d',
        glbListElement: '.tree', 
        viewMode: 'Y',
    });

    bimViewer.init();
    bimViewer.addComponent();
    bimViewer.animate();
    
    window.bimViewer = bimViewer;
}