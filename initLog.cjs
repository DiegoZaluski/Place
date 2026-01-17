function initLog(COLORS) {
  
  const linux = `
    ██╗  ██╗██╗   ██╗ ██████╗  ██╗       █████╗  ██████╗  ██╗                    
    ██║  ██║██║   ██║██╔════╝  ██║      ██╔══██╗ ██╔══██╗ ██║                    
    ███████║██║   ██║██║  ███╗ ██║      ███████║ ██████╔╝ ██║                    
    ██╔══██║██║   ██║██║   ██║ ██║      ██╔══██║ ██╔══██╗ ╚═╝                    
    ██║  ██║╚██████╔╝╚██████╔╝ ███████╗ ██║  ██║ ██████╔╝ ██╗                   
    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═╝    
    `
  return console.log(
    COLORS.MAGENTA +
      `
--------------------------------------------------------------------------------

  ${process.platform === 'linux' ? linux : '[HUGLAB] running on Windows'}                  
                                                                       
--------------------------------------------------------------------------------

                             PLATFORM PLACE                            
                          DEVELOPMENT EDITION                          
                              BETA VERSION                            

--------------------------------------------------------------------------------
INITIALIZATION REPORT
--------------------------------------------------------------------------------
Version:     1.0.0-beta
Status:      Initializing systems
Workspace:   ${process.cwd()}
User:        ${process.env.USER || process.env.USERNAME || 'Unknown'}
Platform:    ${process.platform} ${process.arch}
Electron:    ${process.versions.electron}
Time:        ${new Date().toLocaleString()}
--------------------------------------------------------------------------------
` +
      COLORS.MAGENTA,
  );
}

module.exports = { initLog };

