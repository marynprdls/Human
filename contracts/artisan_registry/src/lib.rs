#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

const ADMIN_KEY: Symbol = symbol_short!("admin");

#[derive(Clone)]
#[contracttype]
pub struct Artisan {
    pub stellar_address: Address,
    pub name: String,
    pub verified: bool,
    pub registered_at: u64,
    pub total_payments: u32,
}

#[contract]
pub struct ArtisanRegistry;

#[contractimpl]
impl ArtisanRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
    }
    
    pub fn register_artisan(env: Env, artisan_address: Address, name: String) {
        artisan_address.require_auth();
        
        if env.storage().persistent().has(&artisan_address) {
            panic!("Already registered");
        }
        
        let artisan = Artisan {
            stellar_address: artisan_address.clone(),
            name,
            verified: false,
            registered_at: env.ledger().timestamp(),
            total_payments: 0,
        };
        
        env.storage().persistent().set(&artisan_address, &artisan);
        env.events().publish((symbol_short!("register"),), artisan_address);
    }
    
    pub fn verify_artisan(env: Env, admin: Address, artisan_address: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance()
            .get(&ADMIN_KEY).expect("Not initialized");
        
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        let mut artisan: Artisan = env.storage().persistent()
            .get(&artisan_address).expect("Artisan not found");
        
        artisan.verified = true;
        env.storage().persistent().set(&artisan_address, &artisan);
        env.events().publish((symbol_short!("verify"),), artisan_address);
    }
    
    pub fn get_artisan(env: Env, artisan_address: Address) -> Option<Artisan> {
        env.storage().persistent().get(&artisan_address)
    }
    
    pub fn is_registered(env: Env, artisan_address: Address) -> bool {
        env.storage().persistent().has(&artisan_address)
    }
    
    pub fn is_verified(env: Env, artisan_address: Address) -> bool {
        if let Some(artisan) = env.storage().persistent()
            .get::<Address, Artisan>(&artisan_address) {
            artisan.verified
        } else {
            false
        }
    }
    
    pub fn increment_payments(env: Env, artisan_address: Address) {
        artisan_address.require_auth();

        let mut artisan: Artisan = env.storage().persistent()
            .get(&artisan_address).expect("Artisan not found");
        artisan.total_payments += 1;
        env.storage().persistent().set(&artisan_address, &artisan);
        env.events().publish((symbol_short!("payment"),), artisan_address);
    }
    
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&ADMIN_KEY)
            .expect("Not initialized")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize_and_register() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, ArtisanRegistry);
        let client = ArtisanRegistryClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let artisan = Address::generate(&env);
        
        client.initialize(&admin);
        client.register_artisan(&artisan, &String::from_str(&env, "Test Artisan"));
        
        assert!(client.is_registered(&artisan));
        assert!(!client.is_verified(&artisan));
    }
    
    #[test]
    fn test_verify_artisan() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register_contract(None, ArtisanRegistry);
        let client = ArtisanRegistryClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let artisan = Address::generate(&env);
        
        client.initialize(&admin);
        client.register_artisan(&artisan, &String::from_str(&env, "Test"));
        client.verify_artisan(&admin, &artisan);
        
        assert!(client.is_verified(&artisan));
    }
}