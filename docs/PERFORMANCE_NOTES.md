# Performance Optimierungen

## Debug vs Release Mode

Die App ist im **Debug Mode** signifikant langsamer wegen:
- JavaScript wird interpretiert statt kompiliert
- React DevTools Overhead
- Hot Reload Listener
- Hermes Debugger Verbindung

### Release Build erstellen:

```powershell
# Windows Release Build
npx react-native run-windows --release --arch x64

# Web Production Build  
npm run web:build
```

## Implementierte Optimierungen

1. **React.memo** für große Listen-Items
2. **useMemo** für Navigation Theme
3. **useCallback** für Event Handler in Listen
4. **FlatList** statt ScrollView für lange Listen
5. **Image Caching** via react-native-fast-image (falls benötigt)

## Noch zu prüfen

- [ ] Bundle Size Analyse (`npx react-native-bundle-visualizer`)
- [ ] Hermes Engine aktiviert?
- [ ] Lazy Loading für Screens
