<div class="fasteroids-header">
  <div class="fasteroids-title">
    <a
      href="https://github.com/SimHacker/fasteroids" 
      target="_new"
    >Fasteroids</a>:
    a Space Rock Lava Lamp Shoot-Em-Up Game, by 
    <a
      href="https://medium.com/@donhopkins"
      target="_new"
    >Don Hopkins</a>.
  </div>
  <div class="fasteroids-instructions">
    Tractor: h j k l, arrows; Accelerate: s; Slow: z; Stop: z; Turn: a d, 90: q e, 180: w; Fire: space; Rock: r
  </div>
</div>

<canvas
    class="fasteroids-canvas"
	bind:this={canvas}
></canvas>

<style>
    .fasteroids-header {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: auto;
        text-align: center;
        padding: 10px;
        background-color: #40404080;
        border-bottom: 1px solid white;
        z-index: 100;
    }

    .fasteroids-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .fasteroids-instructions {
        font-size: 14px;
    }

	.fasteroids-canvas {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: auth;
        height: auto;
		background-color: #000000;
        z-index: 0;
	}
</style>

<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Fasteroids from './Fasteroids';

    let canvas: HTMLCanvasElement | null = null;
    let width: number = 512;
    let height: number = 512;
    let fasteroids: Fasteroids | null = null;

	onMount(() => {

        fasteroids = new Fasteroids();
        fasteroids.init(canvas);

        fasteroids.startGame();

		return () => {
            if (fasteroids !== null) {
    			fasteroids.stopGame();
            }
		};

	});

</script>

