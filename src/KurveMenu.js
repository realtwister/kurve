/**
 *
 * Program:     Kurve
 * Author:      Markus Mächler, marmaechler@gmail.com
 * License:     http://www.gnu.org/licenses/gpl.txt
 * Link:        http://achtungkurve.com
 *
 * Copyright © 2014, 2015 Markus Mächler
 *
 * Kurve is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kurve is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kurve.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

'use strict';

Kurve.Menu = {
    
    boundOnKeyDown: null,
    audioPlayer: null,
    scrollKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Spacebar', ' '],
    countDownInterval: null,
    count: null,
    isCountingDown: false,
    
    init: function() {
        this.initPlayerMenu();
        this.addWindowListeners();
        //this.addMouseListeners();
        this.initMenuMusic();
    },
        
    initPlayerMenu: function() {
        var playerHTML = '';
        
        Kurve.players.forEach(function(player) {
            playerHTML += player.renderMenuItem();
        });
        
        document.getElementById('menu-players-list').innerHTML += playerHTML;
    },
    
    addWindowListeners: function() {
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.boundOnKeyDown, false);
    },

    addMouseListeners: function() {
        var playerItems = document.getElementById('menu-players-list').children;

        for (var i=0; i < playerItems.length; i++) {
            playerItems[i].addEventListener('click', this.onPlayerItemClicked, false);
        }
    },

    initMenuMusic: function() {
        this.audioPlayer = Kurve.Sound.getAudioPlayer();
        // this.audioPlayer.play('menu-music', {loop: true, background: true, fade: 2000, volume: 1});
    },
    
    removeWindowListeners: function() {
        window.removeEventListener('keydown', this.boundOnKeyDown, false);  
    },

    onPlayerItemClicked: function(event) {
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.togglePlayerActivation(this.id);
    },
    
    onKeyDown: function(event) {
        if (event.metaKey) {
            return; //Command or Ctrl pressed
        }

        if (Kurve.Menu.scrollKeys.indexOf(event.key) >= 0) {
            event.preventDefault(); //prevent page scrolling
        }

        if (event.keyCode === 32) {
            Kurve.players.forEach(function(player){
                Kurve.Menu.activatePlayer(player.getId());
                Kurve.Menu.audioPlayer.play('menu-navigate');
            })
        }

        Kurve.players.forEach(function(player) {
            if ( player.isKeyLeft(event.keyCode) ) {
                Kurve.Menu.activatePlayer(player.getId());
                Kurve.Menu.audioPlayer.play('menu-navigate');
            } else if ( player.isKeyRight(event.keyCode) ) {
                Kurve.Menu.deactivatePlayer(player.getId());
                Kurve.Menu.audioPlayer.play('menu-navigate');
            } 
            // else if ( player.isKeySuperpower(event.keyCode) ) {
            //     Kurve.Menu.nextSuperpower(player.getId());
            //     Kurve.Menu.audioPlayer.play('menu-navigate');
            // }
        });

        if(Kurve.players.every(player=> player.isActive())){
            this.startCountDown();
        }
    },

    startCountDown: function(){
        if(this.isCountingDown){
            return;
        }
        this.isCountingDown = true;
        console.log("starting countdown")
        document.getElementById('menu-count-down').classList.remove("grow")
        this.count = Kurve.Config.Game.menuStartDelay;
        this.countDownInterval = setInterval(function() {
            document.getElementById('menu-count-down').innerHTML = "AAACHTUUUNNGG..."+this.count;
            if(this.count <= 2){
                document.getElementById('menu-count-down').classList.add("grow")
            }
            if(!Kurve.players.every(player=> player.isActive())){
                console.log("stopped early")
                this.stopCountingDown()
            }
            else if(this.count <= 0){
                this.stopCountingDown()
                this.startGame()
            }
            this.count -= 1;
        }.bind(this),1000);
    },

    stopCountingDown: function(){
        if(this.isCountingDown){
        document.getElementById('menu-count-down').innerHTML = ""
        clearInterval(this.countDownInterval)
        this.isCountingDown=false;
        } else{
            console.log("tried to stop counting down but not counting.")
        }
    },

    startGame: function(){
        Kurve.players.forEach(function(player) {
            if ( player.isActive() ) {
                Kurve.Game.curves.push(
                    new Kurve.Curve(player, Kurve.Game, Kurve.Field, Kurve.Config.Curve, Kurve.Sound.getAudioPlayer())
                );    
            }
        });

        if (Kurve.Game.curves.length <= 0) {
            Kurve.Game.curves = [];
            Kurve.Menu.audioPlayer.play('menu-error', {reset: true});

            u.addClass('shake', 'menu');

            setTimeout(function() {
                u.removeClass('shake', 'menu');
            }, 450); //see Sass shake animation in _mixins.scss

            return; //not enough players are ready
        }

        Kurve.Field.init();
        Kurve.Menu.audioPlayer.pause('menu-music', {fade: 1000});
        Kurve.Game.startGame();

        u.addClass('hidden', 'layer-menu');
        u.removeClass('hidden', 'layer-game');
    },

    onNextSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.nextSuperpower(playerId);
    },

    onPreviousSuperPowerClicked: function(event, playerId) {
        event.stopPropagation();
        Kurve.Menu.audioPlayer.play('menu-navigate');
        Kurve.Menu.previousSuperpower(playerId);
    },

    nextSuperpower: function(playerId) {
        var player = Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in Kurve.Superpowerconfig.types) {
            count++;
            if ( !(Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( Object.keys(Kurve.Superpowerconfig.types).length === count) {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[0];
            } else {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[count];
            }

            break;
        }

        player.setSuperpower( Kurve.Factory.getSuperpower(superpowerType) );
    },

    previousSuperpower: function(playerId) {
        var player = Kurve.getPlayer(playerId);
        var count = 0;
        var superpowerType = '';

        for (var i in Kurve.Superpowerconfig.types) {
            count++;
            if ( !(Kurve.Superpowerconfig.types[i] === player.getSuperpower().getType() ) ) continue;

            if ( 1 === count) {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[Object.keys(Kurve.Superpowerconfig.types).length - 1];
            } else {
                superpowerType = Object.keys(Kurve.Superpowerconfig.types)[count - 2];
            }

            break;
        }

        player.setSuperpower( Kurve.Factory.getSuperpower(superpowerType) );
    },

    activatePlayer: function(playerId) {
        if ( Kurve.getPlayer(playerId).isActive() ) return;

        Kurve.getPlayer(playerId).setIsActive(true);

        u.removeClass('inactive', playerId);
        u.addClass('active', playerId);
    },

    deactivatePlayer: function(playerId) {
        if ( !Kurve.getPlayer(playerId).isActive() ) return;

        Kurve.getPlayer(playerId).setIsActive(false);

        u.removeClass('active', playerId);
        u.addClass('inactive', playerId);
    },

    togglePlayerActivation: function(playerId) {
        if ( Kurve.getPlayer(playerId).isActive() ) {
            Kurve.Menu.deactivatePlayer(playerId);
        } else {
            Kurve.Menu.activatePlayer(playerId);
        }
    },

    requestFullScreen: function() {
        document.body.webkitRequestFullScreen();
    },
};
