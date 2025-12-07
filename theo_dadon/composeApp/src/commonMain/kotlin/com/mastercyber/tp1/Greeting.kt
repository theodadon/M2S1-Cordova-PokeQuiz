package com.mastercyber.tp1

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// Client HTTP
private val client = HttpClient {
    install(ContentNegotiation) {
        json(
            Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            }
        )
    }
}

// Modèle JSON Tyradex
@Serializable
data class Pokemon(
    val name: Name? = null,
    val sprites: Sprites? = null
)

@Serializable
data class Name(
    val fr: String? = null
)

@Serializable
data class Sprites(
    val regular: String? = null
)
fun toGrayPixels(pixels: IntArray): IntArray {
    val result = IntArray(pixels.size)

    for (i in pixels.indices) {
        val c = pixels[i]

        val a = (c ushr 24) and 0xFF
        val r = (c ushr 16) and 0xFF
        val g = (c ushr 8) and 0xFF
        val b = c and 0xFF

        val gray = (0.299 * r + 0.587 * g + 0.114 * b).toInt().coerceIn(0, 255)

        result[i] = (a shl 24) or (gray shl 16) or (gray shl 8) or gray
    }

    return result
}

class Greeting {

    // Récupère le Pokémon complet (nom + sprites)
    private suspend fun fetchPokemon(): Pokemon {
        val random = (1..1025).random()
        return client
            .get("https://tyradex.vercel.app/api/v1/pokemon/$random")
            .body()
    }

    // Pour le texte : "Compose: <Nom>"
    suspend fun fetchPokemonName(): String? {
        val pokemon = fetchPokemon()
        return pokemon.name?.fr ?: "Unknown"
    }

    // Pour l'image : ByteArray de sprites.regular
    suspend fun fetchPokemonImage(): ByteArray? {
        val pokemon = fetchPokemon()
        val url = pokemon.sprites?.regular ?: return null
        val bytes: ByteArray = client.get(url).body()
        return bytes
    }
}
