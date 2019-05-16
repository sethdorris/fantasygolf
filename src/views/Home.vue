<template>
<div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <Leaderboard></Leaderboard>
</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Leaderboard from '@/components/Leaderboard.vue'; // @ is an alias to /src

@Component({
  components: {
      Leaderboard,
  },
})
export default class Home extends Vue {}
</script>
