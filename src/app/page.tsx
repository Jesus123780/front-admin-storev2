import { CounterClientComponent } from "@/components/ClientComponent";
import { ElectronCheck } from "@/components/ElectronCheck";
import { ServerPokemonComponent } from "@/components/ServerComponent";
import { Home } from "@/container/Home";
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-around p-24 flex-row">
      {/* <ElectronCheck /> */}

      {/* <ServerPokemonComponent /> */}

      <Home />
    </main>
  );
}
