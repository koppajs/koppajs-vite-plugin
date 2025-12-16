export default function camelToKebab(camel: string) {
  return (
    camel
      // Ersetze jeden Großbuchstaben in der Mitte eines Wortes durch einen Bindestrich gefolgt vom Kleinbuchstaben
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      // Wandle den gesamten String in Kleinbuchstaben um
      .toLowerCase()
  )
}
