#!/bin/bash

# GlobeGenius - Script de démarrage développement
# Ce script facilite le lancement de l'environnement de développement

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║          GlobeGenius Dev Setup            ║"
echo "║     Service d'Alertes Voyage avec ML      ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Fonction pour vérifier les prérequis
check_requirements() {
    echo -e "${YELLOW}Vérification des prérequis...${NC}"
    
    # Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        echo "Installez Docker depuis https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker installé${NC}"
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose installé${NC}"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js n'est pas installé (optionnel pour Docker)${NC}"
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            echo -e "${YELLOW}⚠️  Node.js version $NODE_VERSION détectée. Version 18+ recommandée${NC}"
        else
            echo -e "${GREEN}✓ Node.js $(node -v) installé${NC}"
        fi
    fi
    
    # Vérifier le fichier .env
    if [ ! -f .env ]; then
        echo -e "${YELLOW}📋 Création du fichier .env depuis .env.example${NC}"
        cp .env.example .env
        echo -e "${RED}⚠️  IMPORTANT: Configurez vos clés API dans le fichier .env${NC}"
        echo "Ouvrez .env et ajoutez :"
        echo "  - FLIGHTLABS_API_KEY"
        echo "  - SENDGRID_API_KEY"
        echo "  - TRAVELPAYOUT_TOKEN"
        read -p "Appuyez sur Entrée une fois les clés configurées..."
    fi
}

# Fonction pour démarrer les services
start_services() {
    echo -e "\n${YELLOW}Démarrage des services Docker...${NC}"
    
    # Arrêter les anciens containers
    docker-compose -f docker-compose.dev.yml down
    
    # Construire et démarrer
    docker-compose -f docker-compose.dev.yml up -d --build
    
    echo -e "${YELLOW}Attente du démarrage des services...${NC}"
    sleep 10
    
    # Vérifier l'état des services
    echo -e "\n${YELLOW}État des services :${NC}"
    docker-compose -f docker-compose.dev.yml ps
}

# Fonction pour initialiser la base de données
init_database() {
    echo -e "\n${YELLOW}Initialisation de la base de données...${NC}"
    
    # Attendre que PostgreSQL soit prêt
    echo "Attente de PostgreSQL..."
    until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U globegenius; do
        sleep 2
    done
    
    echo -e "${GREEN}✓ PostgreSQL prêt${NC}"
    
    # Initialiser les routes
    echo "Initialisation des routes..."
    docker-compose -f docker-compose.dev.yml exec -T backend npm run db:seed || true
}

# Fonction pour afficher les URLs
show_urls() {
    echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 GlobeGenius est prêt !${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "📱 ${GREEN}Frontend${NC}         : http://localhost:3001"
    echo -e "🔧 ${GREEN}Backend API${NC}      : http://localhost:3000"
    echo -e "🤖 ${GREEN}ML Service${NC}       : http://localhost:8000"
    echo -e "📊 ${GREEN}PGAdmin${NC}          : http://localhost:5050"
    echo -e "📧 ${GREEN}Mailhog${NC}          : http://localhost:8025"
    echo ""
    echo -e "📚 ${YELLOW}Documentation API${NC} : http://localhost:3000/api-docs"
    echo -e "❤️  ${YELLOW}Health Check${NC}     : http://localhost:3000/health"
    echo ""
    echo -e "${YELLOW}Commandes utiles :${NC}"
    echo "  docker-compose -f docker-compose.dev.yml logs -f     # Voir les logs"
    echo "  docker-compose -f docker-compose.dev.yml down        # Arrêter"
    echo "  docker-compose -f docker-compose.dev.yml restart     # Redémarrer"
    echo ""
}

# Menu principal
main_menu() {
    echo -e "\n${YELLOW}Que souhaitez-vous faire ?${NC}"
    echo "1) Démarrage complet (recommandé pour la première fois)"
    echo "2) Démarrage rapide (si déjà configuré)"
    echo "3) Arrêter tous les services"
    echo "4) Voir les logs"
    echo "5) Réinitialiser la base de données"
    echo "6) Quitter"
    
    read -p "Choix (1-6): " choice
    
    case $choice in
        1)
            check_requirements
            start_services
            init_database
            show_urls
            ;;
        2)
            start_services
            show_urls
            ;;
        3)
            echo -e "${YELLOW}Arrêt des services...${NC}"
            docker-compose -f docker-compose.dev.yml down
            echo -e "${GREEN}✓ Services arrêtés${NC}"
            ;;
        4)
            echo -e "${YELLOW}Affichage des logs (Ctrl+C pour quitter)...${NC}"
            docker-compose -f docker-compose.dev.yml logs -f
            ;;
        5)
            echo -e "${YELLOW}Réinitialisation de la base de données...${NC}"
            docker-compose -f docker-compose.dev.yml exec postgres psql -U globegenius -d globegenius_dev -f /docker-entrypoint-initdb.d/init.sql
            init_database
            echo -e "${GREEN}✓ Base de données réinitialisée${NC}"
            ;;
        6)
            echo -e "${GREEN}Au revoir !${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Choix invalide${NC}"
            main_menu
            ;;
    esac
}

# Lancer le menu principal
main_menu

# Proposer de voir les logs en continu
echo ""
read -p "Voulez-vous voir les logs en temps réel ? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    docker-compose -f docker-compose.dev.yml logs -f
fi