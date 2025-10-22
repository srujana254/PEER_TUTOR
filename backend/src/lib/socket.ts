let ioInstance: any = null;

export function setIo(io: any) {
  ioInstance = io;
}

export function getIo() {
  return ioInstance;
}
