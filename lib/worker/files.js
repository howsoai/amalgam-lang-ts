export function isFileSystemRequest(command) {
    if (command == null) {
        return false;
    }
    switch (command) {
        case "createLazyFile":
        case "writeFile":
        case "readFile":
        case "unlink":
        case "mkdir":
        case "rmdir":
        case "readdir":
            return true;
        default:
            return false;
    }
}
