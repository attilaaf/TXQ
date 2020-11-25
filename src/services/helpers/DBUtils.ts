 
export class DBUtils {
  
  static encodeBufferToPG(buf: Buffer | any) {
    if (buf === null || buf === undefined) {
      return 'null';
    }
    if (!isNaN(buf)) {
      return buf;
    }
  
    if (buf instanceof Buffer) {
       return `\\\\x` + buf.toString('hex');
    }

    if (!buf) {
      return "null";
    }

    const bufNew = Buffer.from(buf, 'hex');
    return bufNew;
  }
} 