export function ResolveNetwork (address:string) {
  const [ip, cidr] = address.split('/')
  const mask = subnetMask(parseInt(cidr))
  return {
    ip,
    subnet: mask,
    bounds: calculateBounds(ip, mask)
  }
}
const subnetMask = (cidr) => {
  const mask = [];
  for (let i = 0; i < 4; i++) {
      if (cidr >= 8) {
          mask.push(255);
          cidr -= 8;
      } else {
          mask.push(256 - Math.pow(2, 8 - cidr));
          cidr = 0;
      }
  }
  return mask.join('.');
};
const calculateBounds = (ip, subnetMask) => {
  const ipParts = ip.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  const lowerBound = ipParts.map((part, index) => part & maskParts[index]).join('.');
  const upperBound = ipParts.map((part, index) => part | (255 - maskParts[index])).join('.');

  return  [lowerBound, upperBound] ;
};
