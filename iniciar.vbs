Dim shell
Set shell = CreateObject("WScript.Shell")

' Lanza el servidor Node.js SIN ventana negra (0 = oculto)
shell.Run "node """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\server.js""", 0, False

' Espera 2 segundos para que el servidor arranque
WScript.Sleep 2000

' Abre el navegador predeterminado
shell.Run "http://localhost:3000"

Set shell = Nothing
