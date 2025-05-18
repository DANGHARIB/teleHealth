#!/bin/bash

# Script pour démarrer les serveurs frontend et backend

echo "Démarrage de l'application mobile Tabeebou..."

# Démarrer le backend
echo "Démarrage du serveur backend..."
cd ../backend && npm run dev & backend_pid=$!

# Attendre un peu pour que le backend démarre
sleep 2

# Démarrer le frontend
echo "Démarrage du serveur frontend..."
cd ../frontend && npm start & frontend_pid=$!

# Fonction pour arrêter proprement les processus
function cleanup {
  echo "Arrêt des serveurs..."
  kill $backend_pid
  kill $frontend_pid
  exit
}

# Capter les signaux d'interruption
trap cleanup SIGINT SIGTERM

echo "Les serveurs sont démarrés. Appuyez sur Ctrl+C pour arrêter."

# Attendre que les processus se terminent
wait $backend_pid
wait $frontend_pid 