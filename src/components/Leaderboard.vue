<template>
    <div>
        {{ message }}
    </div>
</template>



<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Leaderboard extends Vue {
    public data(): any {
        return {
            message: 'Testing',
        };
    }
}
</script>