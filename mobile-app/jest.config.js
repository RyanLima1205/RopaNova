// Config minimale, scindée du reste de la stack Expo/RN : ne couvre pour
// l'instant que les modules purs (services/mappers). Pas de jest-expo ici.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
}
